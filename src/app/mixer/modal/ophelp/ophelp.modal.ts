import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: 'app-ophelp',
  templateUrl: './ophelp.modal.html',
  styleUrls: ['./ophelp.modal.scss']
})
export class OpHelpModal implements OnInit {
  
  documenation: any ="bleh";
  name: string;

  constructor(private dialogRef: MatDialogRef<OpHelpModal>,
             @Inject(MAT_DIALOG_DATA) private data: any) { 
        
        this.name = data.op.name;

        const ngHtmlParser = require('angular-html-parser');

            //** need to write a note here to locate the text we are interested in. */

        (async () => {
          const response = await fetch('https://unstabledesign.github.io/docs');
          const text = await response.text();
          const { rootNodes, errors } = ngHtmlParser.parse(text);
          this.findDocumentation(this.name, rootNodes[2]);
          const el: HTMLElement = document.getElementById("docs");
          el.innerHTML = this.documenation;
        })();

    }

  /**
   * traverses all divs in the "body" in search of the element that matches this name
   * @param name 
   * @param element the "html" element of the returned page
   * @returns a string of the contained documentation
   */
  private findDocumentation (name: string, element: any){


    element.children.forEach(child => {
      if(child.name == "body" || child.name == "div" || child.name == "section") {

        if(child.attrs.findIndex(at => (at.name == "id" && at.value.toString() == name.toString())) != -1){
          this.documenation = this.extractDocumentationFromDiv(child);
        }else{
          this.findDocumentation(name, child);
        }

      }

    });


  }

  private extractDocumentationFromDiv(el: any): string{
    console.log("extract called on", el);
    let docs:string = "";
    const ndx: number = el.children.findIndex(child => child.name=="div");
    console.log("found div at ", ndx);
    if(ndx == -1) return docs;

    const div: any = el.children[ndx];
    docs = div.children[0].value;
    console.log(docs, div.children[0]);

    return docs;
  }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close();
  }

}
