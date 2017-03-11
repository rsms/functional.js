# functional.js

Functional.js provides a set of functions
for working in a functional style with JavaScript and TypeScript
on lazy-evaluated sequences.

Build javascript into dist folder:

```txt
$ tsc
```

Try it with the interactive REPL:

```
$ ./repl
❯ filter(city => city[0] == 'S',
...      map(p => p.city, values(data.people)))
[ 'Seattle',
  'Stockholm',
  'San Francisco',
  ... ]
❯
```

From NPM: [`yarn add func-js`](https://www.npmjs.com/package/func-js)

## Introduction

Let's start with something simple. Here's a map of some imaginary "users":

```js
const users = new Map([
  ['bob',   {name: 'Bob',   age: 28}],
  ['anne',  {name: 'Anne',  age: 29}],
  ['robin', {name: 'Robin', age: 33}],
])
```

We can `map` users to their names, resulting in a lazy `Seq<string>`:

```js
const names = map(([_, p]) => p.name, users)
```

We can iterate over `names` with  provides an `Iterator` interface,
making it work with anything that accepts an iterator:

```js
console.log('names:')
for (let name of names) {
  console.log(' -', name)
}
// names:
//  - Bob
//  - Anne
//  - Robin
```

Or just `collect` all values into an array:

```js
console.log('names:', collect(names))
// names: [ 'Bob', 'Anne', 'Robin' ]
```

### Working with sequences

Okay. Here are some small tech start-ups you probably haven't heard of:

```js
const companies = new Set([
  {name:'Microsoft', founded: {year: 1975, month: 4}},
  {name:'Apple',     founded: {year: 1976, month: 4}},
  {name:'Google',    founded: {year: 1998, month: 9}},
  {name:'Facebook',  founded: {year: 2004, month: 2}},
])
```

We can `take` only the first three values,
here also mapping each company to its name.
Since `take` returns a lazy sequence, no values are actually generated here,
nor is our map function called.

```js
const companyNames = map(c => c.name, companies)
const someCompanyNames = take(3, companyNames)
```

`collect` all values of someCompanyNames into an array and log it:

```js
console.log("first few companies' names:",
  collect(someCompanyNames))
// first few companies' names: [ 'Microsoft', 'Apple', 'Google' ]
```

From here on, we will use a convenience function for logging to the console:

```js
function show(message, v) {
  console.log(message, /*is just seq ... */ ? collect(take(50, v)) : v)
}
```

It makes our code easier to read. (This function is not part of `functional.js`.)

Let's see what the average founding year of these companies is.
For this task we can `fold` the values together:

```js
let foundingYears = map(x => x.founded.year, companies)
show('average founding year:',
     fold((avgYear, year) => (avgYear + year) / 2,
          foundingYears))
// average founding year: 1995.375
```

`fold` is similar to `collect` but instead of returning an array
of all values, it returns the _accumulated value_.
`fold` operates left-to-right and is also knows as "reduce" and "foldl".

`fold` can also take an initial value. When the initial value is omitted—as in our example above—the first value of the Seq is used as the initial accumulator.
Here we provide an explicit initial value:

```js
show('average founding year, including this year:',
     fold((avgyear, year) => (avgyear + year) / 2,
          foundingYears, new Date().getFullYear()))
// average founding year, including this year: 1998
// (when new Date().getFullYear() = 2017)
```

The `foldr` function produces similar results to `fold`, but in the reverse order (from right to left):

```js
show('some company names in reverse:',
     foldr((names, name) => `${names} > ${name}`,
           someCompanyNames))
// some company names in reverse: Google > Apple > Microsoft
```

Note that `foldr` uses more memory than `fold` and is limited by the stack-depth limit of JS runtimes that don't support tail-call elimination.

Similarly to `foldr`, `reverse` reverses a sequence:

```js
show('some company names in reverse, again:',
     reverse(someCompanyNames))
// some company names in reverse, again: [ 'Google', 'Apple', 'Microsoft' ]
```

As with `foldr`: beware that `reverse` requires as much memory as the sum of everything in the sequence, so don't use it on large sequences. If possible, create the initial sequence in reverse order instead of using the `reverse` function. For instance, if you start out with an array of items, pass the array itself to `reverse` before applying any other seqeunce operations.

`drop` is a function similar to `take`, but rather than limiting outout, it skips over some number of values:

```js
show('all companies but the two oldest:',
     drop(2, companyNames))
// all companies but the two oldest: [ 'Google', 'Facebook' ]
```

The `filter` function can be used to skip values which doesn't pass some criteria:

```js
show('companies which name ends in "le":',
     map(c => c.name,
         filter(c => c.name.substr(-2) == "le",
                companies)))
// companies which name ends in "le": [ 'Apple', 'Google' ]
```

The function passed to `filter` decides if an item is included (if the function returns true), or skipped (when the function returns false.)

Let's test if a seq is `empty`:

```js
show('Is there any company which name ends in "le"?',
     !empty(filter(c => c.name.substr(-2) == "le",
                   companies)))
// Is there any company which name ends in "le"? true

show('Is there any company which name ends in "x"?',
     !empty(filter(c => c.name.substr(-2) == "x",
                   companies)))
// Is there any company which name ends in "x"? false
```

Again, since `seq`s are lazy, in our first case above, only one of the filter functions are called. This is different from how the standard Array functions in JavaScript works where each operation is performed on every single item before continuing with another operation. In most cases dealing with Seqs is faster than using `Array.prototype.map`, `.filter` and friends.

Using the `any` function, we can implement the above code in a more readable way:

```js
show('Is there any company which name ends in "le"?',
     any(c => c.name.substr(-2) == "le",
         companies))
// Is there any company which name ends in "le"? true

show('Is there any company which name ends in "x"?',
     any(c => c.name.substr(-2) == "x",
         companies))
// Is there any company which name ends in "x"? false
```

The `all` function can be used to check if all values fit a certain criteria:

```js
show('Does all company names contain an "e"?',
     all(c => c.name.indexOf("e") != -1,
         companies))
// Does all company names contain an "e"? false

const yearToday = new Date().getFullYear()
show('Were all companies founded in the last 50 years?',
     all(c => yearToday - c.founded.year < 50,
         companies))
// Were all companies founded in the last 50 years?? true
```

`zip` is a useful function that takes two sequences and produces a sequence of tuples containing the respective input sequences' values:

```js
const namez = zip(map(c => c.name, companies),
                  map(p => p.name, values(users)))
show('zipping company name with user name:', namez)
// zipping company name with user name: [ [ 'Microsoft', 'Bob' ],
//   [ 'Apple', 'Anne' ],
//   [ 'Google', 'Robin' ] ]
```

Since many of the standard JavaScript collections accept Iterables (which Seq is), we can use zip to easily build things like Maps:

```js
show('Map of company name to user name:', new Map(namez))
// Map of company name to user name: Map {
//  'Microsoft' => 'Bob', 'Apple' => 'Anne', 'Google' => 'Robin' }
```

We can `zip` any number of sequences together:

```js
const ln = '\n  '
show('A bit of history on some imaginary people:', ln +
     join(ln,
          map(([year, company, name, nickname]) =>
                `${name} aka "${nickname}" at ${company} in ${year}`,
              zip(map(x => x.founded.year, companies),
                  map(x => x.name, companies),
                  map(p => p.name, values(users)),
                  keys(users) ))))
// A bit of history on some imaginary people:
//   Bob aka "bobby" at Microsoft in 1975
//   Anne aka "ann3" at Apple in 1976
//   Robin aka "rob" at Google in 1998
```

The `zipf` function allows us to produce anything; nost just lists of values:

```js
show('A bit of history on some imaginary people:', ln +
     join(ln,
          zipf((year, company, name, nickname) =>
                 `${name} aka "${nickname}" at ${company} in ${year}`,
               map(x => x.founded.year, companies),
               map(x => x.name, companies),
               map(p => p.name, values(users)),
               keys(users) )))
// A bit of history on some imaginary people:
//   Bob aka "bobby" at Microsoft in 1975
//   Anne aka "ann3" at Apple in 1976
//   Robin aka "rob" at Google in 1998
```


### Creating a `Seq`

A `Seq` is simply an object that provides an iterator interface for producing values. Most functions in `functional.js` that return a Seq returns a _lazy_ sequence, meaning its values are generated only when needed.

To create a lazy sequence from some existing data, pass anything to the `seq` function:

```js
show('items of an array:', seq([1, 2, 3]))
// items of an array: [ 1, 2, 3 ]

show('characters of text:', seq("hello😀"))
// characters of text: [ 'h', 'e', 'l', 'l', 'o', '😀' ]

show('keys and values of an object:',
     seq({
       bob:            "Happy",
       Anne:           "Hungry",
       "Frans-Harald": "Bored"
     }))
// keys and values of an object: [
//   [ 'bob', 'Happy' ],
//   [ 'Anne', 'Hungry' ],
//   [ 'Frans-Harald', 'Bored' ] ]
```

Oftentimes you have data that's constant or somehow predefined, in which case the `seq` function can efficiently convert anything into a `Seq`. The neat thing about this design is that any item implementing [the iterable protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) is a valid `Seq`. This includes all collection types of ES5 (Array, TypedArray, string, etc); when such an item is passed to the `seq` function, the item is simply returned. The only case where `seq` creates a new `Seq` object is when the item provided is an object and 

Use the `charseq` function to get a Seq of UTF-16 codepoints of some string (instead of grapheme clusters, as is the case with `seq` on strings):

```js
show('characters as UTF-16 codepoints:',
     charseq("hello😀"))
// characters as UTF-16 codepoints: [ 104, 101, 108, 108, 111, 55357, 56832 ]
```

`range` is a useful function for declaring ranges of numbers with an optional "step" arguments that controls the step increment:

```js
show('range(0,4):    ', range(0,4))
show('range(2,5):    ', range(2,5))
show('range(-3,3):   ', range(-3,3))
show('range(0,20,5): ', range(0,20,5))
// range(0,4):     [ 0, 1, 2, 3 ]
// range(2,5):     [ 2, 3, 4 ]
// range(-3,3):    [ -3, -2, -1, 0, 1, 2 ]
// range(0,20,5):  [ 0, 5, 10, 15 ]
```

Because `Seq`s are lazy, we can even declare infinite ranges by leaving out the `end` argument, or by using `Infinite`:

```js
show('take(4, range()):    ', take(4, range()))
show('take(4, range(100)): ', take(4, range(100)))
show('take(4, range(100, Infinity, 100)): ',
  take(4, range(100, Infinity, 100)))
// take(4, range()):     [ 0, 1, 2, 3 ]
// take(4, range(100)):  [ 100, 101, 102, 103 ]
// take(4, range(100, Infinity, 100)):  [ 100, 200, 300, 400 ]
```

More complex sequences can be created by providing a function that creates Iterators:

```js
show('Custom iterable with generator:',
     seq(function*(){
       for (let i = 3; i; --i) {
         yield '#' + Math.random().toFixed(3)
       }
     }))
// Custom iterable with generator: [ '#0.354', '#0.295', '#0.291' ]

show('Custom iterable with function:',
     seq(() => ({
       i: 3,
       next() { return {
         value: '#' + Math.random().toFixed(3),
         done: --this.i < 0
       }}
     })))
// Custom iterable with function: [ '#0.219', '#0.746', '#0.917' ]
```

### Conveniences

`apply` is a convenience function for causing side-effects, like printing something to the console. It's like `forEach` but operates on lazy sequences:

```js
apply(console.log, foundingYears)
// 1975
// 1976
// 1998
// 2004
```

`join` glues values together into a string:

```js
show('Company months:',
     join('/', map(c => c.founded.month,
                   companies)))
// Company months: 4/4/9/2
```

`avg` calculates the average of all numbers:

```js
show('average founding year:',
     avg(foundingYears))
// average founding year: 1995.375
```

`sum`, `min` and `max` returns the sum, smallest and largest number, respectively:

```js
const userAges = map(([_, p]) => p.age, users)
show("sum of users' age:", sum(userAges))
show("youngest user age:", min(userAges))
show("oldest user age:  ", max(userAges))
// sum of users' age: 90
// youngest user age: 28
// oldest user age:   33
```

`nth` returns the value at a certain "index" into the sequence:

```js
show('4th company in the list:',
     nth(3, companies).name)
// 4th company in the list: Facebook
```

Note that this means generating values for—and throwing away the results of—intermediate values.
