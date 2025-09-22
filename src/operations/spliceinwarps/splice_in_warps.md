
## Parameters
- `ends between insert`: a number describing how many warp ends of the receiving draft should occur before switching to the splicing draft. 
- `calculate repeats`: this defines what happens if/when you connect drafts with different numbers of ends. If `repeat inputs to match size` is selected, AdaCAD will expand the number of pics in the output draft such that all input structures repeat at the even intervals across along length of the cloth. If the `do not repeat inputs to match size` the smaller draft will integrated, but not repeated, into the larger draft.
- `splice style`: users have the option to integrate the splicing draft into the receiving draft in two ways. The first, `line by line` integrates the splicing draft one line at a time. If `whole draft` is selected, the entire splicing draft is inserted into the receiving draft. 

## Inlets
- `receiving draft` - the draft that will be spliced into
- `splicing draft` - the draft that will be inserted


## Application
Warp-wise splicing can be used to add a specific textual feature to the length of the cross in even intervals

## Developer
adacad id: `splice in warps`
