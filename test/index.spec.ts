import { evolve, unset } from "../src"

const state = {
    user: {
        name: "Alice",
        age: 22,
        friends: [{ name: "Bob", age: 44 }],
        interests: {
            tea: true,
            mushrooms: true,
        } as Record<string, boolean>,
    },
    foo: {
        a: false,
        b: false,
    },
}

describe("the evolve function", () => {
    it("performs a deep merge of the passed in objects", () => {
        const a: typeof state.user = evolve({ age: 33 }, state.user)
        expect(a).toEqual({
            ...state.user,
            age: 33,
        })
        const b: typeof state = evolve(
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
        expect(b).toEqual({
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
        const a: typeof state.user = evolve(
            { age: (age: number) => age + 11 },
            state.user
        )
        expect(a).toEqual({
            ...state.user,
            age: 33,
        })
        const b: typeof state = evolve(
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
        expect(b).toEqual({
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
        // only optional keys can be removed
        const a: Partial<typeof state> = evolve(
            { foo: unset },
            state as Partial<typeof state>
        )
        expect(a).toEqual({ user: state.user })
        const b: typeof state.user = evolve(
            { interests: { mushrooms: unset, tea: false } },
            state.user
        )
        expect(b).toEqual({
            ...state.user,
            interests: {
                tea: false,
            },
        })
    })

    it("has a curried form", () => {
        const a: typeof state.user = evolve({ age: 33 })(state.user)
        expect(a).toEqual({
            ...state.user,
            age: 33,
        })
        const b: typeof state.user = evolve({ age: (age: number) => age + 11 })(
            state.user
        )
        expect(b).toEqual({
            ...state.user,
            age: 33,
        })
        const c: Partial<typeof state> = evolve({ foo: unset })(
            state as Partial<typeof state>
        )
        expect(c).toEqual({ user: state.user })
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
        // uncomment to confirm type error
        // const error1 = evolve({ name: "Alice" }, { name: 1 })

        // unknown because of extra key
        const unknown1 = evolve({ name: "Alice", age: 22 }, { name: "Bob" })
        expect(unknown1).toBeTruthy()

        const tagState = {
            tags: {
                foo: true,
                bar: true,
            } as { [key: string]: boolean },
        }
        const a: typeof tagState = evolve({ tags: { baz: true } }, tagState)
        expect(a).toEqual({
            tags: {
                foo: true,
                bar: true,
                baz: true,
            },
        })
        // unknown because of wrong index type
        const unknown2 = evolve({ tags: { baz: "true" } }, tagState)
        expect(unknown2).toBeTruthy()

        const b: {
            other: number
            tags: {
                foo: boolean
                baz: string
                bar: string
            }
        } = evolve.poly(
            { tags: { bar: "true", baz: "true" } },
            { tags: { foo: true, bar: true }, other: 1 }
        )
        expect(b).toEqual({
            tags: { foo: true, bar: "true", baz: "true" },
            other: 1,
        })
        // unset keys are removed from result type
        const c: { age: number } = evolve.poly(
            { name: unset },
            { name: "Alice", age: 22 }
        )
        expect(c).toEqual({ age: 22 })

        const d: { name?: string } = evolve({ name: "Bob" }, {
            name: "Alice",
        } as { name?: string })
        expect(d).toEqual({ name: "Bob" })

        // unknown because removing a required key
        const unknown3 = evolve({ name: unset }, { name: "Alice", age: 22 })
        expect(unknown3).toBeTruthy()

        const e: typeof tagState = evolve({ tags: { foo: unset } }, tagState)
        expect(e).toEqual({
            tags: {
                bar: true,
            },
        })

        const f: typeof tagState = evolve(
            { tags: { foo: unset, bar: false } },
            tagState
        )
        expect(f).toEqual({
            tags: {
                bar: false,
            },
        })

        const g: { name: string; age: number } = evolve.poly(
            { age: (): number => 22 },
            { name: "Alice" }
        )
        expect(g).toEqual({ name: "Alice", age: 22 })

        const h: { dict: Record<string, string> } = evolve(
            { dict: () => ({ a: "" } as Record<string, string>) },
            { dict: {} as Record<string, string> }
        )
        expect(h).toEqual({ dict: { a: "" } })
    })
})
