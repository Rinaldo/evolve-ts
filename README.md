# evolve-ts

`npm install evolve-ts`

Immutably update nested objects with patches containing values or functions to update values

- **Simple yet powerful**: simple syntax for performing immutable updates
- **Type-safe**: Robust type checking and type inferences
- **Tiny**: < 1kb gzipped, zero dependencies

## Usage

Let's say we have the following state
```javascript
import { evolve, unset } from "evolve-ts"

const state = {
    user: {
        name: "Alice",
        age: 22
    }
}
```

We can set a value
```javascript
evolve({ user: { name: "Bob" } }, state)
// { user: { name: "Bob", age: 22 } }
```

Update a value
```javascript
evolve({ user: { age: age => age + 1 } }, state)
// { user: { name: "Alice", age: 23 } }
```

Remove a key
```javascript
evolve({ user: { age: unset } }, state)
// { user: { name: "Alice" } }
```

All together now!
```javascript
import { evolve, unset } from "evolve-ts"

const alice = {
    name: "Alice",
    age: 22,
    active: true,
    likes: ["wonderland"],
    nested: {
        foo: true,
        bar: true,
    }
}

evolve({
    name: "Bob", // sets the value of name
    age: age => age + 1, // updates the value of age
    active: unset, // removes the active key
    likes: ["building"], // sets the value of likes (only objects are merged)
    nested: {
        foo: false // sets the value of foo
    }
}, alice)
/*
{
    name: "Bob",
    age: 23,
    likes: ["building"],
    nested1: {
        foo: false,
        bar: true,
    }
}
*/
```

### Setting object values directly

Object values are merged recursively, but return values of functions are set directly. To replace an object value use a `constant` function.

```javascript
evolve({
    user: () => ({
        name: "Bob",
        age: 33,
    })
}, state)

// { user: { name: "Bob", age: 33 } }
```

### Removing object entries

Entries can be removed by setting the value to `unset` or using an updater function that returns `unset`. 

```javascript
evolve({
    user: {
        name: unset,
        age: () => unset
    }
}, state)

// { user: {} }
```

### Working with Arrays

evolve-ts provides two functions to update arrays, `map` and `adjust`.

`map` is a version of the map function that can either take a callback or a patch. The following are all equivalent, they all increment the number of likes for each user in the users array.
```javascript
import { map } from "evolve-ts"
const inc = n => n + 1

map({ likes: inc })(users)

map(evolve({ likes: inc }))(users)

map(user => ({ ...user, likes: inc }))(users)
```

`adjust` conditionally maps values with a callback function or patch. Value(s) to map can be specified with an index or predicate function. Negative indexes are treated as offsets from the array length.

```javascript
import { adjust } from "evolve-ts"

// set the first user as preferred
adjust(0, { preferred: true })(users)

// set the last user as preferred
adjust(-1, { preferred: true })(users)

// set all users who have 100 or more likes as preferred
adjust(user => user.likes > 99, { preferred: true })(users)

// like map, can also take a callback to update the value
adjust(0, user => ({ ...user, preferred: true }))(users)
```

Other array helpers such as `append` and `filter` are not re-implemented by evolve-ts as they are already included in [fp-ts](https://www.npmjs.com/package/fp-ts), [Ramda](https://www.npmjs.com/package/ramda), and many other libraries.

```javascript
import { adjust, evolve, map } from "evolve-ts"
import { append, filter, inc } from "" // your favorite functional utility library


const state = {
    users: [
        { name: "Alice", age: 22, id: 0 },
        { name: "Bob", age: 33, id: 1 }
    ]
}

// add a new user
evolve({
    users: append({ name: "Claire", age: 44, id: 2 })
}, state)

// increment the ages of all users
evolve({
    users: map({ age: inc })
}, state)

// set the age of a user by id
evolve({
    users: adjust(user => user.id === 1, { age: 55 })
}, state)

// remove a user by id
evolve({
    users: filter(user => user.id !== 1)
}, state)
```

## Currying

```javascript
import { evolve } from "evolve-ts"

const incrementAge = evolve({ age: age => age + 1 })

incrementAge({ name: "Alice", age: 22 })
// { name: "Alice", age: 23 }
```

## TypeScript Support

The `evolve` function is strictly typed and does not allow polymorphism. The return type is always the same as the target type.
```typescript
import { evolve, unset } from "evolve-ts"

// cannot change the type of values in target
evolve({ age: "22" }, { name: "Alice", age: 22 })
// TypeError: Type 'string' is not assignable to type 'number | ((value: number) => number)'

// updaters have correctly inferred types (updater argument in this example is inferred as number)
evolve({ age: age => age + 1 }, { name: "Alice", age: 22 })
// ReturnType: { name: string; age: number; }

// unset can be used on optional keys
evolve({ age: unset }, { name: "Alice", age: 22 } as { name: string; age?: number; })
// ReturnType: { name: string; age?: number; }

// unset cannot be used on required keys
evolve({ age: unset }, { name: "Alice", age: 22 })
// TypeError: Type 'typeof Unset' is not assignable to type 'number | ((value: number) => number)'

// cannot add extraneous properties to the patch
evolve({ name: "Alice", age: 23 }, { age: 22 })
// TypeError: ...'name' does not exist in type 'Patch<{ age: number; }>'

// cannot set non-nullable properties to undefined when exactOptionalPropertyTypes is enabled
evolve({ name: undefined }, { name: "Alice" })
// Type 'undefined' is not assignable to type 'string | ((value: string) => string)'
```

The `evolve_` function is a type alias for `evolve` that allows polymorphism while still producing strongly typed results.
```typescript
import { evolve_, unset } from "evolve-ts"

// changing age from number to string
evolve_({ age: "22" }, { name: "Alice", age: 22 })
// ReturnType: { name: string; age: string; }

// adding name key
evolve_({ name: "Alice", age: 23 }, { age: 22 })
// ReturnType: { name: string, age: number; }

// adding age key with updater function
evolve_({ age: (): number => 22 }, { name: "Alice" })
// ReturnType: { name: string, age: number; }

// removing age key
evolve_({ age: unset }, { name: "Alice", age: 22 })
// ReturnType: { name: string; }
```

## Shallow Updates

The behavior of `shallowEvolve` is similar to the spread operator except it accepts updater functions.

```typescript
import { evolve, shallowEvolve } from "evolve-ts"

declare const user

shallowEvolve({ user }) /* equivalent to */ evolve({ user: () => user })

// evolve can be used within shallowEvolve if a deep merge is needed for a particular key
shallowEvolve({ user: evolve(user) }) /* equivalent to */ evolve({ user })
```

## Provided Functions

- `evolve`: Takes a patch object and a target object and returns a version of the target object with updates from the patch applied. A patch is a subset of the target object containing either values or functions to update values. Functions are called with existing values from the target, non-object values are set into the target, and object values are merged recursively.
- `evolve_`: Type alias for evolve that allows polymorphism while still producing strongly typed results.
- `map`: Maps values in an array with a callback function or patch.
- `adjust`: Conditionally maps values in an array with a callback function or patch. Value(s) to map can be specified with an index or predicate function. Negative indexes are treated as offsets from the array length.
- `unset`: Sentinel value that causes its key to be removed from the output.
- `shallowEvolve`: Like `evolve` but performs shallow updates.
- `shallowMap`: Like `map` but performs shallow updates.
- `shallowAdjust`: Like `adjust` but performs shallow updates.


## Why evolve-ts?

evolve-ts was created as a lightweight alternative to [updeep](https://www.npmjs.com/package/updeep) and [immer](https://www.npmjs.com/package/immer). It has all of updeep's core functionality, strong TypeScript support, is only a fraction of the size of updeep or immer, and is dependency free.

## Caveats

evolve-ts treats all functions in patches as updater functions, so if your state contains function values you want to update you must wrap the updates in a `constant` function.

```typescript
import { evolve } from "evolve-ts"

const state = {
    name: "Alice",
    greet: (person) => console.log(`Hi ${person} I'm Alice!`)
}
// need to use a wrapper to set new function values
evolve({
    name: "Bob",
    greet: () => (person) => console.log(`Hi ${person} I'm Bob!`)
}, state)
```

## License

MIT
