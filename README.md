# evolve-ts

`npm install evolve-ts`

Update nested objects immutably with patches containing new values or functions to update values

- **Simple yet powerful**: simple syntax for performing immutable updates
- **Type-safe**: Robust type checking and type inferences
- **Tiny**: < 0.5kb gzipped, zero dependencies

## Examples

Set a value
```javascript
import { evolve, unset } from "evolve-ts"

const state = {
    user: {
        name: "Alice",
        age: 22
    }
}

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

Set the value of an object (instead of merging the values within it) by using a function
```javascript
evolve({ user: () => ({ name: "Bob" }) }, state)
// { user: { name: "Bob" } }
```

All together now!
```javascript
import { evolve, unset } from "evolve-ts"

const alice = {
    name: "Alice",
    age: 22,
    active: true,
    likes: ["wonderland"],
    nested1: {
        foo: true,
        bar: true,
    },
    nested2: {
        foo: false,
        bar: false,
    }
}

evolve({
    name: "Bob", // sets the value of name
    age: age => age + 1, // updates the value of age
    active: unset, // removes the active key
    likes: ["building"], // sets the value of likes (only objects are merged)
    nested1: {
        foo: false // sets the value of foo
    },
    nested2: () => ({ // sets the value of nested2 (return values of functions are never merged)
        baz: true
    })
}, alice)
/*
{
    name: "Bob",
    age: 23,
    likes: ["building"],
    nested1: {
        foo: false,
        bar: true,
    },
    nested2: {
        baz: true
    }
}
*/
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
```javascript
import { evolve, unset } from "evolve-ts"

// cannot change the type of values in target
evolve({ age: "22" }, { name: "Alice", age: 22 })
// TypeError: Type 'number' is not assignable to type 'string'

// cannot add values to target
evolve({ name: "Alice", age: 23 }, { age: 22 })
// TypeError: Property 'name' is missing in type '{ age: number; }' but required in type '{ name: string; age: number; }'

// updaters should be typed and the return type should be the same as the argument type
evolve({ age: (age: number) => age + 1 }, { name: "Alice", age: 22 })

// the unset flag should only be used with optional keys
evolve({ age: unset }, { name: "Alice", age: 22 } as { name: string; age?: number; })
```

The `evolve.poly` function is a type alias for `evolve` that allows polymorphism while still producing strongly typed results.
```javascript
import { evolve, unset } from "evolve-ts"

// changing age from number to string
evolve.poly({ age: "22" }, { name: "Alice", age: 22 })
// ReturnType: { name: string; age: string; }

// adding name key
evolve.poly({ name: "Alice", age: 23 }, { age: 22 })
// ReturnType: { name: string, age: number }

// adding age key with updater function
evolve.poly({ age: () => 22 }, { name: "Alice" })
// ReturnType: { name: string, age: number }

// changing age from number to unknown
evolve.poly({ age: unset }, { name: "Alice", age: 22 })
// ReturnType: { name: string; age: unknown; }
```

## Provided Functions

- `evolve`: Takes a patch object and a target object and returns a version of the target object with updates from the patch applied
- `evolve.poly`: Type alias for evolve that allows polymorphism while still producing strongly typed results
- `unset`: Sentinel value that causes its key to be removed from the output

## Why evolve-ts?

The `evolve` function with its strict typings is ideal for use in reducers and other places where values are updated but types don't change. The `evolve.poly` function allows polymorphism while still producing strongly typed results.

evolve-ts was created as an alternative to [updeep](https://www.npmjs.com/package/updeep). It has all updeep's core functionality and much stronger TypeScript support, while being only 5% of the size and dependency free.

## License

MIT
