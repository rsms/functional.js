import {
  seq, isSeq, keys, values, range, charseq, map, filter, zipf, zip,
  take, drop, nth, fold, foldr, reverse, any, all, empty, apply,
  join, collect, min, max, sum, avg
} from './functional'

declare var console :{ log(...v :any[]) }

function show(message, v) {
  console.log(message,
    typeof v == 'object' &&
    v.length === undefined &&
    v.size === undefined &&
    isSeq(v) ?
      collect(take(50, v)) :
      v)
}

const users = new Map([
  ['bobby', {name: 'Bob',   age: 28}],
  ['ann3',  {name: 'Anne',  age: 29}],
  ['rob',   {name: 'Robin', age: 33}],
])

const names = map(([_, p]) => p.name, users)

// We can iterate over `names`, which is a lazy Seq
console.log('names:')
for (let name of names) {
  console.log(' -', name)
}

// Or we can `collect` all values into an array:
show('names:', names)

// Here are some small tech start-ups you probably haven't heard of:
const companies = new Set([
  {name:'Microsoft', founded: {year: 1975, month: 4}},
  {name:'Apple',     founded: {year: 1976, month: 4}},
  {name:'Google',    founded: {year: 1998, month: 9}},
  {name:'Facebook',  founded: {year: 2004, month: 2}},
])

// We can `take` only the first three values, mapping to each company's name.
// Since `take` returns a lazy sequence, no values are actually generated
// here, nor is our map function called.
const companyNames = map(c => c.name, companies)
const someCompanyNames = take(3, companyNames)

// `collect` all values of someCompanyNames into an array and log it:
show("first few companies' names:", someCompanyNames)

// Let's see what the average founding year is by `fold`ing all values
// together. `fold` is similar to `collect` but instead of returning an array
// of all values, it returns the _accumulated value_
let foundingYears = map(x => x.founded.year, companies)

show('average founding year:',
  fold((avgYear, year) => (avgYear + year) / 2, foundingYears))

show('average founding year, including this year:',
  fold((avgyear, year) => (avgyear + year) / 2,
       foundingYears, new Date().getFullYear()))

show('some company names in reverse:',
  foldr((names, name) => `${names} > ${name}`, someCompanyNames))

show('some company names in reverse, again:',
  reverse(someCompanyNames))

apply(console.log, foundingYears)

show('Company months:',
  join('/',
    map(c => c.founded.month, companies)))

show('items of an array:', seq([1, 2, 3]))
show('characters as text:', seq("hello😀"))
show('keys and values of an object:', 
  seq({bob:'Happy', Anne:'Hungry', "Frans-Harald":"Bored"}))
show('characters as UTF-16 codepoints:', charseq("hello😀"))

show('items of an array in reverse order:', reverse([1, 2, 3]))
show('items of a Set in reverse order:', reverse(new Set([1, 2, 3])))
show('items of a Map in reverse order:',
  reverse(new Map([[1,'a'], [2,'b'], [3,'c']])))

show('Iterable:', seq(new Uint32Array([1,2,3])))
show('Iterable array:', seq([1,2,3]))
show('Iterable string:', seq("hello"))
const obj1 = {d:4, e:5}
show('Iterable object:', seq({__proto__:obj1, a:1, b:2, c:3}))
show('Iterable object, allProperties:',
    seq({__proto__:obj1, a:1, b:2, c:3}, true))

show('Custom iterable with generator:',
     seq(function*(){
       for (let i = 3; i; --i) {
         yield '#' + Math.random().toFixed(3)
       }
     }))

show('Custom iterable with function:',
     seq(() => ({
       i: 3,
       next() { return {
         value: '#' + Math.random().toFixed(3),
         done: --this.i < 0
       }}
     })))

show('range(0,4):    ', range(0,4))
show('range(2,5):    ', range(2,5))
show('range(-3,3):   ', range(-3,3))
show('range(0,20,5): ', range(0,20,5))

const infiniteNumbers = range()
show('take(4, range()):    ', take(4, range()))
show('take(4, range(100)): ', take(4, range(100)))
show('take(4, range(100, Infinity, 100)): ',
  take(4, range(100, Infinity, 100)))

show('take(3, drop(20, range())): ',
  take(3, drop(20, range())))

show('all companies but the two oldest:',
  drop(2, companyNames))

show('all companies but the two oldest:',
  drop(2, companyNames))

show('companies which name ends in "le":',
  map(c => c.name,
    filter(c => c.name.substr(-2) == "le", companies)))

show("average founding year using avg():", avg(foundingYears))
const userAges = map(p => p.age, values(users))
show("sum of users' age:", sum(userAges))
show("youngest user age:", min(userAges))
show("oldest user age:  ", max(userAges))

show('Is there any company which name ends in "le"?',
  !empty(filter(c => c.name.substr(-2) == "le", companies)))
show('Is there any company which name ends in "x"?',
  !empty(filter(c => c.name.substr(-2) == "x", companies)))

show('Is there any company which name ends in "le"?',
  any(c => c.name.substr(-2) == "le", companies))
show('Is there any company which name ends in "x"?',
  any(c => c.name.substr(-2) == "x", companies))

show('Does all company names contain an "e"?',
  all(c => c.name.indexOf("e") != -1, companies))
const yearToday = new Date().getFullYear()
show('Were all companies founded in the last 50 years?',
  all(c => yearToday - c.founded.year < 50, companies))

const namez = zip(
  map(c => c.name, companies),
  map(p => p.name, values(users)))
show('zipping company name with user name:', namez)
show('Map of company name to user name:', new Map(namez))

const ln = '\n  '
show('A bit of history on some imaginary people:',
  ln + join(ln,
    map(([year, company, name, nickname]) =>
        `${name} aka "${nickname}" at ${company} in ${year}`,
      zip(
        map(x => x.founded.year, companies),
        map(x => x.name, companies),
        map(p => p.name, values(users)),
        keys(users) ))))

show('A bit of history on some imaginary people:',
  ln + join(ln,
    zipf((year, company, name, nickname) =>
      `${name} aka "${nickname}" at ${company} in ${year}`,
      map(x => x.founded.year, companies),
      map(x => x.name, companies),
      map(p => p.name, values(users)),
      keys(users) )))


show('4th company in the list:', nth(3, companies).name)
