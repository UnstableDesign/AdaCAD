#!/bin/bash
#Parses the operation description file and generates an indivdiual md file for each operation

# Check if a JSON file argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_json_file>"
    exit 1
fi

# Define the input JSON file and output directory
json_file="$1"
output_dir="../AdaCADdocs/docs/howtouse/operations/categories"

# Create the output directory if it doesn't exist
mkdir -p "$output_dir"

# Use jq to parse each operation and create separate markdown files
jq -c '.classifications[]' "$json_file" | while read -r classification; do
    # Extract fields from JSON
    echo "parsing"
    name=$(echo "$classification" | jq -r '.category_name')
    op_names=$(echo "$classification" | jq -r '.op_names')
    description=$(echo "$classification" | jq -r '.description')
    color=$(echo "$classification" | jq -r '.color')
    
    # Set filename based on the operation name
    filename="${output_dir}/$(echo "$name" | tr ' /' '__' | tr '[:upper:]' '[:lower:]').md"



    # Write content to the Markdown file
    {
        echo "# $name"
        echo " $color "
        echo "## Description"
        echo "$description"
        echo "## Ops"
        echo " | $name |  |"
        echo " | -------- | ------- | "
        printf " | <!--[name](./operations/%s)--> | <!--![file](./img/.png)--> |  \n'" ${op_names[@]}


    } > "$filename"
    
    echo "Created $filename"
done

echo "All categeories have been parsed into separate Markdown files in $output_dir"

