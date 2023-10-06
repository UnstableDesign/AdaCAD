# initDraft
Generates an empty draft object with a unique id with the following default values.

| parameter      | default |
| -----------  |----------|
| id | a unique 8 digit number |
| warps  | 1 |
| wefts  | 1|
| gen_name | "drafty"|
| ud_name |  ""
| drawdown | [[createCell(false)]]
| colShuttleMapping | [0]
| rowShuttleMapping |  [1]
| colSystemMapping |  [0]
| rowSystemMapping | [0]



## Parameters
None

## Returns
[Draft](draft)



## Implementation
```
const d: Draft = initDraft();
```

