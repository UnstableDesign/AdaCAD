# Sequence.OneD
A OneD Sequence object stores a single list of heddle values. You can use a OneD Sequence object to represent a single warp or weft. You can instantiate a sequence object as follows: 


## Implementations

```jsx title="src/app/core/model/sequence.js"

const seq: Sequence.OneD = new Sequence.OneD();

```

This will instate a blank sequence. 



```jsx title="src/app/core/model/sequence.js"

const seq: Sequence.OneD = new Sequence.OneD([0,0,1,1]);

```
This will instate a new sequence with the value [0,0,1,1];


## Chaining Functions

Because the OneD functions return the object itself, they can be chained for easy reading. For example, the following two code blocks could be used to generate the same sequence. 

```jsx
// Option 1: The long way

const seq: Sequence.OneD = new Sequence.OneD([0,0,1,1]);
seq.push(0)
seq.push(1)
seq.push(2)

```

```jsx
// Option 2: The short way

const seq: Sequence.OneD = new Sequence.OneD([0,0,1,1]).push(0).push(1).push(2);

```