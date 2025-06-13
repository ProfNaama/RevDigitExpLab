import os
import json
import base64
# if not working, install pandas using "pip install pandas psycopg2"
import pandas as pd
import psycopg2


file_path = os.path.abspath(__file__)
dir_name = os.path.dirname(file_path) 

inputfilename=os.path.join(dir_name, 'select_results.json')
outputfilename=os.path.join(dir_name, 'decoded.json')
csv_result_output=os.path.join(dir_name, 'extracted_data.csv')
qestionBankFilePath=os.path.join(dir_name,'../static/surveyData/question_bank.csv')

def read_from_posgres(connectionString, expid):
    # connectionString is of the form:
    # DATABASE_URL=postgres://<user_name>:<password>@>host?:5432/<db name>
    host = connectionString.split('@')[1].split(':')[0]
    database = connectionString.split('@')[1].split('/')[1]
    user = connectionString.split('@')[0].split('//')[1].split(':')[0]
    password = connectionString.split('@')[0].split('//')[1].split(':')[1]
    resultTableName = "rev_digital_exp_lab_results"
    
    # Connection parameters
    conn = psycopg2.connect(
        host=host,
        database=database,
        user=user,
        password=password
    )

    # Create a cursor object
    cur = conn.cursor()

    # Execute a query
    
    print(f"SELECT * FROM {resultTableName} WHERE expid = '{expid}'")
    cur.execute(f"SELECT * FROM {resultTableName} WHERE expid = '{expid}'")

    # Fetch all results
    results = cur.fetchall()
    # Close the cursor and connection
    cur.close()
    conn.close()
    print(f"extracted {len(results)} results" )
    return list(map(lambda r:r[1], results))

def write_raw_select_results(connectionString, expid, outfilename):
    raw_results = read_from_posgres(connectionString, expid)
    with open(outfilename, 'w') as file:
        json.dump(raw_results, file, indent=4)

def load_json_to_dict(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

def decode_base64_to_dict(data_encoded):
    decoded_data = []
    for data_dict in data_encoded:
        if 'data' in data_dict:
            base64_decoded = base64.b64decode(data_dict['data']).decode('utf-8')
            decoded_dict = json.loads(base64_decoded)
            decoded_dict["timestamp"] = data_dict["time"]
            decoded_data.append(decoded_dict)
        else:
            print('error decoding element')
    return decoded_data

def write_dict_to_file(data_dict, output_file_path):
    with open(output_file_path, 'w') as file:
        json.dump(data_dict, file, indent=4)


def to_csv(data):
    keys_set = set()
    for data_dict in data:
        keys_set.update(data_dict.keys())

    csv_data = []
    for data_dict in data:
        row = {}
        for key in keys_set:
            row[key] = None
        row.update(data_dict)
        csv_data.append(row)
    return csv_data

def write_csv_from_json(data, csv_output_file_path):
    csv_data = to_csv(data)
    
    df = pd.DataFrame(csv_data)

    # sort revID columns
    # have the df columns reindexed by the order of metadata columns followed by data columns
    data_columns = []
    metadata_columns = []
    for col in df.columns:
        if col.startswith('revID'):
            data_columns.append(col)
        else:
            metadata_columns.append(col)
    data_columns.sort(key=lambda x: int(x.split('_')[1]))
    df = df[metadata_columns + data_columns]
    df.to_csv(csv_output_file_path, index=False, header=True)

def to_csv_by_revID(data, question_prefix = "Q_"):
    revset = set()
    for data_dict in data:
        for key in data_dict.keys():
            if key.startswith('revID'):
                rev_num = key.split('_')[1]
                #print("current revid: ", rev_num)   
                
                revset.add(rev_num) 

    # columns list per revID
    revid_data = []
    rev_prefix = "revID"
    for data_dict in data:
        for rev_num in revset:
            currentD = {}
            is_empty = True
            current_rev_prefix = rev_prefix + "_" + rev_num + "_"
            for key in data_dict:
                if key.startswith(rev_prefix):
                    if key.startswith(current_rev_prefix):
                        is_empty = False
                        q_name = key[len(current_rev_prefix):]
                        currentD[rev_prefix] = rev_num
                        currentD[question_prefix + q_name] = data_dict[key]
                else:
                    # metadata - should be in all revids
                    currentD[key] = data_dict[key]
            if not is_empty:
                #pid = currentD["PROLIFIC_PID"]
                #print (f"user: {pid}, revid: {rev_num}")    
                revid_data.append(currentD)
    return revid_data


def write_csv_by_revid_from_json(data, csv_output_file_path):
    question_prefix = "Q_"
    csv_data = to_csv_by_revID(data, question_prefix)
    df = pd.DataFrame(csv_data)
    prolific_id_value_counts = df["PROLIFIC_PID"].value_counts()
    # filter out prolific IDs that have 4 entries (according to 4 revids)
    prolific_ids_to_keep = prolific_id_value_counts[prolific_id_value_counts == 4].index
    df = df[df["PROLIFIC_PID"].isin(prolific_ids_to_keep)]
    
    data_columns = []
    metadata_columns = []
    for col in df.columns:
        if col.startswith(question_prefix):
            data_columns.append(col)
        else:
            metadata_columns.append(col)
    df = df[metadata_columns + data_columns]
    
    # load the input CSV file
    input_csv = "static/surveyData/reviews_data.csv"
    input_df = pd.read_csv(input_csv)
    input_df["ordering"] = input_df.index
    input_df["treatmentGroup"] = input_df["treatmentGroup"].astype(str)
    

    # fix the merge key to match that of the input_df
    df["reviewKey"] = "revID_"
    df["reviewKey"] = df["reviewKey"].str.cat(df["revID"].astype(str))   
    
    # Merge df with input_df
    # Use a left join to keep all rows from df and add the 'ordering' from input_df
    # based on matching values in 'treatment_group_id' and 'reviewKey'

    merged_df = pd.merge(df, input_df[["treatmentGroup","reviewKey", "ordering"]], left_on=['treatment_group_id', 'reviewKey'], right_on=['treatmentGroup', 'reviewKey'], how='left')
    df = merged_df.sort_values(by=["treatment_group_id", "PROLIFIC_PID", "ordering"], inplace=False)
    df.dropna(axis='columns', how='all', inplace=True)  # drop columns that are all NaN

    df.to_csv(csv_output_file_path, index=False, header=True)

def filter_non_relevant_data(data):
    exp_start_date_str = "2025-01-10"
    filtered_data = []
    for data_dict in data:
        if data_dict['timestamp'] > exp_start_date_str:  
            filtered_data.append(data_dict)
    return filtered_data

def filter_non_relevant_data_by_column(data):
    # look for a key that contains 'indifference_relevance'
    filter_question_name = 'indifference_relevance'
    filtered_data = []
    for data_dict in data:
        found_match = False
        for key in data_dict:
            if key.find(filter_question_name) != -1:
                found_match = True
                break
        if found_match:
            filtered_data.append(data_dict)
    return filtered_data


def main(connection_str, expid):
    try:
        # read raw results from postgres and write to a file
        write_raw_select_results(connection_str, expid, inputfilename)
        print(f"Read Raw Postgres data successfully and written to {inputfilename}")
        
        # Load the JSON data from the input file
        original_data = load_json_to_dict(inputfilename)
        
        # Decode the 'data' key and convert to a JSON dictionary
        decoded_data = decode_base64_to_dict(original_data)
        
        # Write the resulting dictionary to an output file
        write_dict_to_file(decoded_data, outputfilename)
        print(f"Decoded data successfully written to {outputfilename}")
        
        # filter out non relevant json entries (we didn't change expid when changing the survey)
        filtered_decoded_data = filter_non_relevant_data(decoded_data)
        
        #write_csv_from_json(decoded_data,csv_result_output )
        write_csv_by_revid_from_json(filtered_decoded_data,csv_result_output )
        print(f"Extracted csv successfully written to {csv_result_output}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("connection_string", type=str, help="pg full connection string")
    parser.add_argument("expid", type=str, help="expid")
    args = parser.parse_args()
    main(args.connection_string, args.expid)
    