#!/bin/bash
#Parses the operation description file and generates an indivdiual md file for each

# Check if a JSON file argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_json_file>"
    exit 1
fi

# Define the input JSON file and output directory
json_file="$1"
output_dir="../AdaCADdocs/docs/howtouse/operations/"

# Create the output directory if it doesn't exist
mkdir -p "$output_dir"

# Use jq to parse each operation and create separate markdown files
jq -c '.operation[]' "$json_file" | while read -r operation; do
    # Extract fields from JSON
    echo "parsing"
    name=$(echo "$operation" | jq -r '.name')
    displayname=$(echo "$operation" | jq -r '.displayname')
    tags=$(echo "$operation" | jq -r '.tags | join(", ")')
    description=$(echo "$operation" | jq -r '.description')
    application=$(echo "$operation" | jq -r '.application')
    
    # Set filename based on the operation name
    filename="${output_dir}/$(echo "$name" | tr ' /' '__' | tr '[:upper:]' '[:lower:]').md"

    # Write content to the Markdown file
    {
        echo "---"
        echo "title: $displayname"
        echo "sidebar_label: $displayname"
        echo "tags: [${tags}]"
        echo "draft: true"
        echo "---"
        echo "# $name"
        echo "<!--![file](./img/$name.png)-->"
        echo "## Parameters"
        echo "- tbd"
        echo "## Description"
        echo "$description"
        echo "## Application"
        echo "$application"
        echo "## Developer"
        echo "adacad id: $name"
    } > "$filename"
    
    echo "Created $filename"
done

echo "All operations have been parsed into separate Markdown files in $output_dir"

