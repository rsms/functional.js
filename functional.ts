export interface Seq<T> extends Iterable<T> {}
export type IteratorCons<T> = ()=>Iterator<T>
export interface KeyIterable<T> {
  keys(): Iterator<T>;
}
export interface ValueIterable<T> {
  values(): Iterator<T>;
}

const done = { value: null, done: true }


export function seq<T>(s :Iterator<T>) :Seq<T>;
export function seq<T>(s :Iterable<T>) :Seq<T>;
export function seq<T>(s :IteratorCons<T>) :Seq<T>;
export function seq<K,V>(s :{[key:string]:V}, allProperties? :boolean) :Seq<[K,V]>;
export function seq<T>(...s :T[]) :Seq<T>;
export function seq<K,V>(
  s :Iterator<V>|Iterable<V>|{[key:string]:V}|IteratorCons<V>|V[],
  allProperties? :boolean)
{
  if (s[Symbol.iterator]) { return s }
  switch (typeof s) {
    case 'function': return { [Symbol.iterator]: s }
    case 'object': {
      if (typeof (s as Iterator<V>).next == 'function') {
        let v, a = []
        while (!(v = (s as Iterator<V>).next()).done) {
          a.push(v.value)
        }
        return a
      }
      return {
        [Symbol.iterator]: allProperties ?
          function* () {
            for (let k in s) { yield [k, s[k]] }
          } :
          function* () {
            for (let k in s) {
              if (s.hasOwnProperty(k)) { yield [k, s[k]] }
            }
          }
      }
    }
    default: throw new TypeError('unexpected type')
  }
}

export function isSeq(s :any) :boolean {
  return !!s[Symbol.iterator]
}

export function keys<T>(x :KeyIterable<T>) :Seq<T> {
  if (typeof x.keys != 'function') { throw new TypeError('not a KeyIterable') }
  return { [Symbol.iterator]() { return x.keys() as Iterator<T> } }
}

export function values<T>(x :ValueIterable<T>) :Seq<T> {
  if (typeof x.values != 'function') { throw new TypeError('not a ValueIterable') }
  return { [Symbol.iterator]: function () { return x.values() } }
}

export function range(start :number=0, end :number=Infinity, step :number=1) :Seq<number> {
  step = Math.abs(step) || 1
  return { [Symbol.iterator]: (end < start) ?
    function* () {
      for (let n = start; n > end; n -= step) { yield n }
    } :
    function* () {
      for (let n = start; n < end; n += step) { yield n }
    }
  }
}

export function charseq(s :string) :Seq<number> {
  return { [Symbol.iterator]: function* () {
    for (let i = 0, L = s.length; i < L; ++i) {
      yield s.charCodeAt(i)
    }
  }}
}

export function map<T,R>(f :(v :T)=>R, s :Seq<T>) :Seq<R> {
  return { [Symbol.iterator]: function* () {
    let v, i = s[Symbol.iterator]()
    while (!(v = i.next()).done) {
      yield f(v.value)
    }
  }}
}

export function filter<T>(f :(v :T)=>boolean, s :Seq<T>) :Seq<T> {
  return { [Symbol.iterator]: function* () {
    let v, i = s[Symbol.iterator]()
    while (!(v = i.next()).done) {
      if (f(v.value)) {
        yield v.value
      }
    }
  }}
}

export function zipf<A,B,R>(f :(v1:A, v2:B)=>R, s1 :Seq<A>, s2 :Seq<B>) :Seq<R>;
export function zipf<A,B,C,R>(f :(v1:A, v2:B, v3:C)=>R, s1 :Seq<A>, s2 :Seq<B>, s3 :Seq<C>) :Seq<R>;
export function zipf<R>(f :(...v:any[])=>R, ...s :Seq<any>[]) :Seq<any>;
export function zipf<R>(f, ...s) {
  if (s.length < 2) { throw new Error('zip requires at least two arguments') }
  return { [Symbol.iterator]: s.length > 2 ?
    function* () {
      const iv = [], c = s.length
      while (true) {
        const vv = []
        for (let n = 0; n < c; ++n) {
          let i = iv[n] || (iv[n] = s[n][Symbol.iterator]())
          let v = i.next()
          if (v.done) {
            return
          }
          vv[n] = v.value
        }
        yield f.apply(null, vv)
      }
    }
    : // common-case of zipping two seqs have specialized implementation
    function* () {
      const i1 = s[0][Symbol.iterator](), i2 = s[1][Symbol.iterator]()
      let v1, v2
      while (!(v1 = i1.next()).done && !(v2 = i2.next()).done) {
        yield f(v1.value, v2.value)
      }
    }
  }
}

export function zip<A,B>(s1 :Seq<A>, s2 :Seq<B>) :Seq<[A,B]>;
export function zip<A,B,C>(s1 :Seq<A>, s2 :Seq<B>, s3 :Seq<C>) :Seq<[A,B,C]>;
export function zip<A,B,C,D>(s1 :Seq<A>, s2 :Seq<B>, s3 :Seq<C>, s4 :Seq<C>) :Seq<[A,B,C,D]>;
export function zip(...s :Seq<any>[]) :Seq<[any]>;
export function zip(...s) {
  if (s.length < 2) { throw new Error('zip requires at least two arguments') }
  return (s.length > 2 ?
    zipf((...v) => v, ...s) :
    // specialized version for common-case:
    { [Symbol.iterator]: function* () {
      const i1 = s[0][Symbol.iterator](), i2 = s[1][Symbol.iterator]()
      let v1, v2
      while (!(v1 = i1.next()).done && !(v2 = i2.next()).done) {
        yield [v1.value, v2.value]
      }
    }}
  )
}

export function take<T>(count :number, s :Seq<T>) :Seq<T> {
  return { [Symbol.iterator]: function* () {
    const i = s[Symbol.iterator]()
    let c = count, v
    while (c-- > 0 && !(v = i.next()).done) {
      yield v.value
    }
  }}
}

export function drop<T>(count :number, s :Seq<T>) :Seq<T> {
  return { [Symbol.iterator]: function* () {
    const i = s[Symbol.iterator]()
    let c = count, v
    while (c-- > 0) {
      if (i.next().done) { return }
    }
    while (!(v = i.next()).done) {
      yield v.value
    }
  }}
}

export function nth<T>(n :number, s :Seq<T>) :T|null {
  let i = s[Symbol.iterator]()
  while (n-- > 0) {
    if (i.next().done) {
      return null
    }
  }
  return i.next().value
}

/**
 * Fold values of s from left to right into accumulator.
 * If initial value of `acc` is not provided, the first value of s will be
 * used instead. Returns null if s is empty and no `acc` was provided.
 */
export function fold<T,R>(f :(acc :T, v :T)=>R, s :Seq<T>) :R;
export function fold<T,R>(f :(acc :R, v :T)=>R, s :Seq<T>, acc :R) :R;
export function fold<T,R>(f, s, acc?) {
  let v, i = s[Symbol.iterator]()
  if (acc === undefined) {
    if ((v = i.next()).done) { return null }
    acc = v.value
  }
  while (!(v = i.next()).done) {
    acc = f(acc, v.value)
  }
  return acc
}

/// Fold values of s from right to left into accumulator.
/// If initial value of `acc` is not provided, the first value of s will be
/// used instead. Returns null if s is empty and no `acc` was provided.
export function foldr<T,R>(f :(acc :T, v :T)=>R, s :Seq<T>) :R;
export function foldr<T,R>(f :(acc :R, v :T)=>R, s :Seq<T>, acc :R) :R;
export function foldr<T,R>(f, s, acc?) {
  let i = s[Symbol.iterator]()
  if (acc === undefined) {
    let v = i.next()
    if (v.done) { return null }
    acc = v.value
  }
  function a(i, acc, f) {
    const v = i.next()
    return v.done ? acc : f(a(i, v.value, f), acc)
  }
  return a(i, acc, f)
}

export function reverse<T>(s :Seq<T>) :Seq<T> {
  return { [Symbol.iterator]:
    Array.isArray(s) || ArrayBuffer.isView(s) ?
      function* () {
        // efficient reverse iteration of array
        let i = (s as Array<T>).length
        while (i > 0) { yield s[--i] }
      } :
    // fallback for any Seq, using a stack buffer:
      function* () {
        let v, i :Iterator<T>|number = s[Symbol.iterator](), stack = []
        while (!(v = i.next()).done) {
          stack.push(v.value)
        }
        i = stack.length
        while (i--) {
          yield stack[i]
        }
      }
    }
}

// True if `f` returns true for any value
export function any<T>(f :(v :T)=>boolean, s :Seq<T>) :boolean {
  let v, i = s[Symbol.iterator]()
  while (!(v = i.next()).done) {
    if (f(v.value)) {
      return true
    }
  }
  return false
}

// True if `f` returns true for all values
export function all<T>(f :(v :T)=>boolean, s :Seq<T>) :boolean {
  let v, i = s[Symbol.iterator]()
  while (!(v = i.next()).done) {
    if (!f(v.value)) {
      return false
    }
  }
  return true
}

export function empty<T>(s :Seq<T>) :boolean {
  return s[Symbol.iterator]().next().done
}

// -- Convenience functions --

// Similar to fold, but without accumulation.
// Used specifically for side-effect.
export function apply<T>(f :(v :T)=>void, s :Seq<T>) :void {
  let v, i = s[Symbol.iterator]()
  while (!(v = i.next()).done) {
    f(v.value)
  }
}

export function join<T>(glue :string, s :Seq<T>) :string {
  return fold((acc, v) => acc + glue + v, s) || ''
}

// Build an array by collecting all values from s
export const collect = Array.from as <T>(s :Seq<T>)=>Array<T>
  // export function collect<T>(s :Seq<T>) :Array<T>;

export function min(s :Seq<number>) :number {
  return fold((acc, v) => acc < v ? acc : v, s) || 0
}

export function max(s :Seq<number>) :number {
  return fold((acc, v) => acc < v ? v : acc, s) || 0
}

export function sum(s :Seq<number>) :number {
  return fold((acc, v) => acc + v, s) || 0
}

export function avg(s :Seq<number>) :number {
  return fold((acc, v) => (acc + v) / 2, s) || 0
}
