import { evolve, unset } from "../src"

const state = {
    user: {
        name: "Alice",
        age: 22,
        friends: [{ name: "Bob", age: 44 }],
        interests: {
            tea: true,
            mushrooms: true,
        },
    },
    foo: {
        a: false,
        b: false,
    },
}

describe("the evolve function", () => {
    it("performs a deep merge of the passed in objects", () => {
        expect(evolve({ age: 33 }, state.user)).toEqual({
            ...state.user,
            age: 33,
        })
        expect(
            evolve(
                {
                    user: {
                        age: 33,
                        friends: [{ name: "Claire", age: 55 }],
                        interests: {
                            mushrooms: false,
                        },
                    },
                    foo: {
                        b: true,
                    },
                },
                state
            )
        ).toEqual({
            ...state,
            user: {
                ...state.user,
                age: 33,
                friends: [{ name: "Claire", age: 55 }],
                interests: {
                    ...state.user.interests,
                    mushrooms: false,
                },
            },
            foo: {
                ...state.foo,
                b: true,
            },
        })
    })

    it("treats functions in the patch object as updates for keys", () => {
        expect(evolve({ age: (age: number) => age + 11 }, state.user)).toEqual({
            ...state.user,
            age: 33,
        })
        expect(
            evolve(
                {
                    user: {
                        age: (age: number) => age + 11,
                        friends: (friends: any[]) => [
                            ...friends,
                            { name: "Claire", age: 55 },
                        ],
                        interests: {
                            mushrooms: (bool: boolean) => !bool,
                        },
                    },
                    foo: {
                        b: true,
                    },
                },
                state
            )
        ).toEqual({
            ...state,
            user: {
                ...state.user,
                age: 33,
                friends: [
                    { name: "Bob", age: 44 },
                    { name: "Claire", age: 55 },
                ],
                interests: {
                    ...state.user.interests,
                    mushrooms: false,
                },
            },
            foo: {
                ...state.foo,
                b: true,
            },
        })
    })

    it("omits keys when their value is the unset helper", () => {
        expect(evolve({ foo: unset }, state)).toEqual({ user: state.user })
        expect(evolve({ interests: { mushrooms: unset } }, state.user)).toEqual(
            {
                ...state.user,
                interests: {
                    tea: true,
                },
            }
        )
    })

    it("has a curried form", () => {
        expect(evolve({ age: 33 })(state.user)).toEqual({
            ...state.user,
            age: 33,
        })
        expect(evolve({ age: (age: number) => age + 11 })(state.user)).toEqual({
            ...state.user,
            age: 33,
        })
        expect(evolve({ foo: unset })(state)).toEqual({ user: state.user })
        const untyped = evolve as any
        expect(untyped()()()()({ age: 33 })(state.user)).toEqual({
            ...state.user,
            age: 33,
        })
    })

    it("can be used within a patch", () => {
        expect(
            evolve(
                {
                    user: {
                        friends: (friends: any[]) =>
                            friends.map(
                                evolve({ age: (age: number) => age + 1 })
                            ),
                    },
                },
                state
            )
        ).toEqual({
            ...state,
            user: {
                ...state.user,
                friends: [{ name: "Bob", age: 45 }],
            },
        })
    })

    it("returns the patch (or result of the patch) when the patch is not an object", () => {
        expect(evolve(null as any, state)).toEqual(null)
        expect(evolve(state, null as any)).toEqual(state)
        expect(evolve(null as any, null as any)).toEqual(null)
        expect(evolve("foo" as any, state)).toEqual("foo")
        expect(evolve(state, "foo" as any)).toEqual(state)
        expect(evolve("foo" as any, "foo" as any)).toEqual("foo")
        expect(evolve(["foo"] as any, state)).toEqual(["foo"])
        expect(evolve(state, ["foo"] as any)).toEqual(state)
        expect(evolve(["foo"] as any, ["foo"] as any)).toEqual(["foo"])
        expect(evolve(42 as any, state)).toEqual(42)
        expect(evolve(state, 42 as any)).toEqual(state)
        expect(evolve(42 as any, 42 as any)).toEqual(42)
        expect(evolve((n: number) => (n + 1) as any, 42 as any)).toEqual(43)
    })

    it("handles being passed objects with different shapes", () => {
        const foo = {
            foo: {
                a: true,
                b: true,
            },
        }
        const bar = {
            bar: {
                a: false,
                b: false,
            },
        }
        expect(evolve(foo, bar as any)).toEqual({ ...foo, ...bar })
        expect(evolve(bar, foo as any)).toEqual({ ...foo, ...bar })
        expect(evolve({ foo: () => true }, {} as any)).toEqual({ foo: true })
        expect(evolve({ foo: {} }, foo)).toEqual(foo)
        expect(evolve({ foo: "foo" }, foo as any)).toEqual({ foo: "foo" })
        expect(evolve(foo, { foo: "foo" } as any)).toEqual(foo)
        expect(evolve({ foo: ["foo"] }, foo as any)).toEqual({ foo: ["foo"] })
        expect(evolve(foo, { foo: ["foo"] } as any)).toEqual(foo)
    })

    it("has correct typings", () => {
        // uncomment to check if this gives a type error as it should
        // const error1 = evolve({ name: "Alice", age: 22 }, { name: "Bob" })
        // const error2 = evolve({ name: "Alice" }, { name: 1 })
        const state = {
            tags: {
                foo: true,
                bar: true,
            } as { [key: string]: boolean },
        }
        // typing patches as partial would make the following type assertion unneccesary but would let errors above slip by
        const a = evolve(
            { tags: { baz: true } as { [key: string]: boolean } },
            state
        )
        expect(a).toEqual({
            tags: {
                foo: true,
                bar: true,
                baz: true,
            },
        })

        const b = evolve.poly(
            { tags: { bar: "true", baz: "true" } },
            { tags: { foo: true, bar: true }, other: 1 }
        )
        expect(b).toEqual({
            tags: { foo: true, bar: "true", baz: "true" },
            other: 1,
        })
        // omitted values are typed as unknown
        const c = evolve.poly({ name: unset }, { name: "Alice", age: 22 })
        expect(c).toEqual({ age: 22 })
    })
})
