! the screenshot script assumes the application is running locally on http://localhost:4200/

To run the screenshot generator use the command: 
`npx tsx main.ts`

Optional args:
--preview (generate the screenshots in raw but don't write them to the docs). 
--padding (in pixels, the amount of whitespace above and below the nodes that shouldn't get cropped out)
  e.g, --padding=100
--filter (runs the script for the specific .ada files provided)
  e.g, --filter=tabby,twill

--

The script finds all of the .ada files in ../docs/docs/reference/operations...

It loads the files into the application through a headless browser

Then applies auto layout, zooms and centers, and lastly screenshots

These images tend to have a fair bit of empty space top and bottom

So we crop them and the outputs are saved to the same same directory that housed the .ada file