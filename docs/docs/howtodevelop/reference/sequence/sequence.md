# Sequence

The Sequence class allows you to create a 1-dimensional or 2-dimensional object and modify its contents. We created this class to streamline the process of procedurally generating drawdowns based on a limited set of rules and manipulations. We wrote mostly because, writing "createCell()" explicitly for every cell in a drawdown becomes tedious. Sequence lets you create structural patterns in a flexible manner by chaining sequences of actions together to "grow" the specific draft you need.

The first simplification offered by the Sequence class is the representation of heddle lifted, heddle lowered, and unset heddles as numbers: 

| sequence value | cell: `is_set` | cell: `is_up` | meaning
| ----------- | ----------- |----------|----------|
| 0 | true | false | heddle is up / lifted
| 1 |  true| true | heddle is down / lowered
| 2 | false | false | heddle is unset



To illustrate the utility of the Sequence class, consider the challenge of making a twill generating function. 

If we didn't have the Sequence function, we might use the following code to create the twill:


```jsx 

let warps_raised: number = 4;
let warps_lowered: number = 5;
let drawdown: Drawdown = [];


//create the first pick of the twill based on the parameters
let first_pic = [];
for(let i = 0; i < (warps_raised + warps_lowered); i++){
        if(j <= warps_raised) first_pic.push(createCell(true));
        else   first_pic.push(createCell(true));
}

//now shift each row by the row number to make it a "TWILL" such that the first row is shifted by 0, second by 1, and so on.
for(let i = 0; i < (warps_raised + warps_lowered); i++){
    drawdown.push([]);
    for(let j = 0; j < (warps_raised + warps_lowered); j++){
        d[i][j] =   first_pic[i][(j+i)%first_pic.length];
    }
}

```

This is more legible with the sequence class:

```jsx 

let warps_raised: number = 4;
let warps_lowered: number = 5;
let twoD = new Sequence.TwoD();

//make a sequence object that represents the number of raised and lowered warps present in each pick of the twill
let s = new Sequence.OneD().pushMultiple(1, warps_raised).pushMultiple(0, warps_lowered);

//on each row, shift it by one and push that shifted value into the twoD sequence
for(let i = 0; i < (warps_raised + warps_lowered); i++){
   s.shift(1);
   twoD.pushWeftSequence(s.val());
}

//convert the 2D sequence into a drawdown
let drawdown: Drawdown = twoD.export();

```

The Sequence class is most powerful when OneD and TwoD objects are used in combination. Furthermore, each function in teh Sequence classes returns "this", allowing the functions to be chained together with a ".". 


You can find all the Sequence functions: [app/core/model/sequence.ts](https://github.com/UnstableDesign/AdaCAD/blob/main/src/app/core/model/sequence.ts)


