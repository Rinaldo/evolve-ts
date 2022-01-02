import {
    adjust,
    evolve,
    evolve_,
    map,
    shallowAdjust,
    shallowEvolve,
    shallowMap,
    unset,
} from "../src"

const state = {
    user: {
        name: "Alice",
        age: 22,
        friends: [
            { name: "Bob", age: 33 },
            { name: "Claire", age: 44 },
        ],
        interests: {
            tea: true,
            mushrooms: true,
        } as Record<string, boolean>,
        meta: {
            active: true,
            deleted: false,
        },
    },
    foo: {
        a: false,
        b: false,
    },
}
const user = state.user

const update =
    <State>(state: State) =>
    (updater: (s: State) => State): State =>
        updater(state)

describe("the evolve function", () => {
    it("performs a deep merge of the passed in objects", () => {
        const userCopy = { ...user }
        const a: typeof user = evolve({ age: 33 }, user)
        expect(a).toEqual({
            ...user,
            age: 33,
        })
        expect(a).not.toBe(user)
        expect(userCopy).toEqual(user)
        const newInterests = {
            mushrooms: false,
        }
        const b: typeof state = evolve(
            {
                user: {
                    age: 33,
                    friends: [{ name: "Claire", age: 44 }],
                    interests: newInterests,
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
                ...user,
                age: 33,
                friends: [{ name: "Claire", age: 44 }],
                interests: {
                    ...user.interests,
                    ...newInterests,
                },
            },
            foo: {
                ...state.foo,
                b: true,
            },
        })
        expect(b.user.interests).not.toBe(newInterests)
    })

    it("treats functions in the patch object as updates for keys", () => {
        const a: typeof user = evolve({ age: (age) => age + 11 }, user)
        expect(a).toEqual({
            ...user,
            age: 33,
        })
        const b: typeof state = evolve(
            {
                user: {
                    age: (age) => age + 11,
                    friends: (friends: any[]) => [
                        ...friends,
                        { name: "Dave", age: 55 },
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
                ...user,
                age: 33,
                friends: [
                    { name: "Bob", age: 33 },
                    { name: "Claire", age: 44 },
                    { name: "Dave", age: 55 },
                ],
                interests: {
                    ...user.interests,
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
        expect(a).toEqual({ user })
        const b: typeof user = evolve(
            { interests: { mushrooms: unset, tea: false } },
            user
        )
        expect(b).toEqual({
            ...user,
            interests: {
                tea: false,
            },
        })
    })

    it("has a curried form", () => {
        const a: typeof user = evolve<typeof user>({ age: 33 })(user)
        expect(a).toEqual({
            ...user,
            age: 33,
        })
        const b: typeof user = evolve<typeof user>({
            age: (age) => age + 11,
        })(user)
        expect(b).toEqual({
            ...user,
            age: 33,
        })
        const c: Partial<typeof state> = evolve<Partial<typeof state>>({
            foo: unset,
        })(state as Partial<typeof state>)
        expect(c).toEqual({ user })
        const untyped = evolve as any
        expect(untyped()()()()({ age: 33 })(user)).toEqual({
            ...user,
            age: 33,
        })
    })

    it("can be used within a patch", () => {
        expect(
            evolve(
                {
                    user: {
                        friends: (friends) =>
                            friends.map(evolve({ age: (age) => age + 1 })),
                    },
                },
                state
            )
        ).toEqual({
            ...state,
            user: {
                ...user,
                friends: [
                    { name: "Bob", age: 34 },
                    { name: "Claire", age: 45 },
                ],
            },
        })

        expect(
            evolve(
                {
                    user: evolve({ age: (age) => age + 1 }),
                },
                state
            )
        ).toEqual({
            ...state,
            user: {
                ...user,
                age: 23,
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
        expect(evolve((n: any) => (n + 1) as any, 42 as any)).toEqual(43)
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
        const tagState = {
            tags: {
                foo: true,
                bar: true,
            } as { [key: string]: boolean },
        }

        // uncomment to confirm type errors
        // const error1 = evolve({ age: "22" }, { name: "Alice", age: 22 })
        // const error2 = evolve({ name: "Alice", age: 22 }, { name: "Bob" })
        // const error3 = evolve({ name: unset }, { name: "Alice", age: 22 })
        // const error4 = evolve({ tags: { baz: "true" } }, tagState)
        // const error5 = evolve({ name: undefined }, { name: "Alice" })

        const a: typeof tagState = evolve({ tags: { baz: true } }, tagState)
        expect(a).toEqual({
            tags: {
                foo: true,
                bar: true,
                baz: true,
            },
        })

        const d: { name?: string } = evolve({ name: "Bob" }, {
            name: "Alice",
        } as { name?: string })
        expect(d).toEqual({ name: "Bob" })

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

        const h: { dict: Record<string, string> } = evolve(
            { dict: () => ({ a: "" }) },
            { dict: {} as Record<string, string> }
        )
        expect(h).toEqual({ dict: { a: "" } })

        type Status = "INIT" | "LOADING" | "SUCCESS" | "FAILURE"

        interface RequestState {
            status: Status
            data: any
        }
        const requestState: RequestState = { status: "INIT", data: null }

        const i: RequestState = evolve({ status: "SUCCESS" }, requestState)
        expect(i).toEqual({ status: "SUCCESS", data: null })

        type CategoryKeys = "a" | "b"
        type Categories = { [key in CategoryKeys]: string }

        interface CategoryState {
            categories: Categories
        }
        const categoryState: CategoryState = {
            categories: { a: "foo", b: "bar" },
        }
        let key = "a"

        const j: CategoryState = evolve(
            { categories: { [key]: "baz" } },
            categoryState
        )
        expect(j).toEqual({ categories: { a: "baz", b: "bar" } })
    })

    it("infers types correctly in the context of setState or something similar", () => {
        const a: { age?: number } = update({ age: 22 } as { age?: number })(
            evolve({ age: unset })
        )
        expect(a).toEqual({})

        const b: { name: "Alice" | "Bob" } = update({
            name: "Alice" as "Alice" | "Bob",
        })(evolve({ name: "Bob" }))
        expect(b).toEqual({ name: "Bob" })

        const tagState = {
            tags: {
                foo: true,
                bar: true,
            } as { [key: string]: boolean },
        }

        const c: typeof tagState = update(tagState)(
            evolve({ tags: { baz: true } })
        )
        expect(c).toEqual({
            tags: {
                foo: true,
                bar: true,
                baz: true,
            },
        })

        const d: { name?: string } = update({ name: "Alice" } as {
            name?: string
        })(evolve({ name: "Bob" }))
        expect(d).toEqual({ name: "Bob" })

        const e: typeof tagState = update(tagState)(
            evolve({ tags: { foo: unset } })
        )
        expect(e).toEqual({
            tags: {
                bar: true,
            },
        })

        const f: typeof tagState = update(tagState)(
            evolve({ tags: { foo: unset, bar: false } })
        )
        expect(f).toEqual({
            tags: {
                bar: false,
            },
        })
    })

    it("has an evolve_ type alias", () => {
        const b: {
            other: number
            tags: {
                foo: boolean
                baz: string
                bar: string
            }
        } = evolve_(
            { tags: { bar: "true", baz: "true" } },
            { tags: { foo: true, bar: true }, other: 1 }
        )
        expect(b).toEqual({
            tags: { foo: true, bar: "true", baz: "true" },
            other: 1,
        })

        const c: { age: number } = evolve_(
            { name: unset },
            { name: "Alice", age: 22 }
        )
        expect(c).toEqual({ age: 22 })

        const g: { name: string; age: number } = evolve_(
            { age: () => 22 },
            { name: "Alice" }
        )
        expect(g).toEqual({ name: "Alice", age: 22 })
    })
})

describe("the array helpers", () => {
    it("has a map function", () => {
        const a: {
            name: string
            age: number
        }[] = map({ age: 55 }, user.friends)
        expect(a).toEqual([
            { name: "Bob", age: 55 },
            { name: "Claire", age: 55 },
        ])

        const b: {
            name: string
            age: number
        }[] = map(
            (friend) => ({ ...friend, age: friend.age + 1 }),
            user.friends
        )
        expect(b).toEqual([
            { name: "Bob", age: 34 },
            { name: "Claire", age: 45 },
        ])

        const c: {
            name: string
            age: number
        }[] = map(evolve({ age: (age) => age + 1 }), user.friends)
        expect(c).toEqual([
            { name: "Bob", age: 34 },
            { name: "Claire", age: 45 },
        ])

        const d: typeof state = evolve(
            {
                user: {
                    friends: map({ age: (age) => age + 1 }),
                },
            },
            state
        )
        expect(d).toEqual({
            ...state,
            user: {
                ...user,
                friends: [
                    { name: "Bob", age: 34 },
                    { name: "Claire", age: 45 },
                ],
            },
        })
    })

    it("has an adjust function", () => {
        const a: {
            name: string
            age: number
        }[] = adjust(0, { age: 55 }, user.friends)
        expect(a).toEqual([
            { name: "Bob", age: 55 },
            { name: "Claire", age: 44 },
        ])

        const b: {
            name: string
            age: number
        }[] = adjust(-1, { age: 55 }, user.friends)
        expect(b).toEqual([
            { name: "Bob", age: 33 },
            { name: "Claire", age: 55 },
        ])

        const c: {
            name: string
            age: number
        }[] = adjust((user) => user.name === "Bob", { age: 55 }, user.friends)
        expect(c).toEqual([
            { name: "Bob", age: 55 },
            { name: "Claire", age: 44 },
        ])

        const d: {
            name: string
            age: number
        }[] = adjust(
            0,
            (friend) => ({ ...friend, age: friend.age + 1 }),
            user.friends
        )
        expect(d).toEqual([
            { name: "Bob", age: 34 },
            { name: "Claire", age: 44 },
        ])

        const e: typeof state = evolve(
            {
                user: {
                    friends: adjust(0, { age: (age) => age + 1 }),
                },
            },
            state
        )
        expect(e).toEqual({
            ...state,
            user: {
                ...user,
                friends: [
                    { name: "Bob", age: 34 },
                    { name: "Claire", age: 44 },
                ],
            },
        })
    })
})

describe("the shallow evolve function", () => {
    it("performs a shallow merge of the passed in objects", () => {
        const a: typeof user = shallowEvolve({ age: 33 }, user)
        expect(a).toEqual({
            ...user,
            age: 33,
        })
        const newInterests = { rabbits: true }
        const b: typeof user = shallowEvolve(
            { ...user, interests: newInterests },
            user
        )
        expect(b).toEqual({
            ...user,
            interests: newInterests,
        })
        expect(b.interests).toBe(newInterests)
    })

    it("treats functions in the patch object as updates for keys", () => {
        const a: typeof user = shallowEvolve({ age: (age) => age + 11 }, user)
        expect(a).toEqual({
            ...user,
            age: 33,
        })
        const b: typeof user = shallowEvolve(
            {
                friends: (friends: any[]) => [
                    ...friends,
                    { name: "Dave", age: 55 },
                ],
            },
            user
        )
        expect(b).toEqual({
            ...user,
            friends: [
                { name: "Bob", age: 33 },
                { name: "Claire", age: 44 },
                { name: "Dave", age: 55 },
            ],
        })
    })

    it("has a curried form", () => {
        const a: typeof user = shallowEvolve<typeof user>({ age: 33 })(user)
        expect(a).toEqual({
            ...user,
            age: 33,
        })
        const b: typeof user = shallowEvolve<typeof user>({
            age: (age) => age + 11,
        })(user)
        expect(b).toEqual({
            ...user,
            age: 33,
        })
        const untyped = shallowEvolve as any
        expect(untyped()()()()({ age: 33 })(user)).toEqual({
            ...user,
            age: 33,
        })
    })

    it("can be used within a patch", () => {
        expect(
            shallowEvolve(
                {
                    meta: shallowEvolve({ active: false }),
                },
                user
            )
        ).toEqual({
            ...user,
            meta: {
                active: false,
                deleted: false,
            },
        })
    })

    it("has correct typings", () => {
        const tagState = {
            tags: {
                foo: true,
                bar: true,
            } as { [key: string]: boolean },
        }

        // uncomment to confirm type errors
        // const error1 = shallowEvolve({ age: "22" }, { name: "Alice", age: 22 })
        // const error2 = shallowEvolve({ name: "Alice", age: 22 }, { name: "Bob" })
        // const error3 = shallowEvolve({ name: undefined }, { name: "Alice" })
        // const error4 = shallowEvolve({ name: unset }, { name: "Alice" })

        const a: typeof tagState = shallowEvolve(
            { tags: { baz: true } },
            tagState
        )
        expect(a).toEqual({ tags: { baz: true } })

        const d: { name?: string } = shallowEvolve({ name: "Bob" }, {
            name: "Alice",
        } as { name?: string })
        expect(d).toEqual({ name: "Bob" })

        type Status = "INIT" | "LOADING" | "SUCCESS" | "FAILURE"

        interface RequestState {
            status: Status
            data: any
        }
        const requestState: RequestState = { status: "INIT", data: null }

        const e: RequestState = shallowEvolve(
            { status: "SUCCESS" },
            requestState
        )
        expect(e).toEqual({ status: "SUCCESS", data: null })

        type CategoryKeys = "a" | "b"
        type Categories = { [key in CategoryKeys]: string }
        const categories: Categories = { a: "foo", b: "bar" }
        let key = "a"

        const f: Categories = shallowEvolve({ [key]: "baz" }, categories)
        expect(f).toEqual({ a: "baz", b: "bar" })

        const g: { name?: string } = shallowEvolve<{ name?: string }>(
            { name: unset },
            { name: "Alice" }
        )
        expect(g).toEqual({})
    })

    it("infers types correctly in the context of setState or something similar", () => {
        const a: { age: number } = update({ age: 22 })(
            shallowEvolve({ age: (age) => age + 1 })
        )
        expect(a).toEqual({ age: 23 })

        const b: { name: "Alice" | "Bob" } = update({
            name: "Alice" as "Alice" | "Bob",
        })(shallowEvolve({ name: "Bob" }))
        expect(b).toEqual({ name: "Bob" })

        const tagState = {
            tags: {
                foo: true,
                bar: true,
            } as { [key: string]: boolean },
        }

        const c: typeof tagState = update(tagState)(
            shallowEvolve({ tags: { baz: true } })
        )
        expect(c).toEqual({
            tags: {
                baz: true,
            },
        })

        const d: { name?: string } = update({ name: "Alice" } as {
            name?: string
        })(shallowEvolve({ name: "Bob" }))
        expect(d).toEqual({ name: "Bob" })
    })
})

describe("the shallow array helpers", () => {
    it("has a map function", () => {
        const a: {
            name: string
            age: number
        }[] = shallowMap({ age: 55 }, user.friends)
        expect(a).toEqual([
            { name: "Bob", age: 55 },
            { name: "Claire", age: 55 },
        ])

        const b: {
            name: string
            age: number
        }[] = shallowMap(
            (friend) => ({ ...friend, age: friend.age + 1 }),
            user.friends
        )
        expect(b).toEqual([
            { name: "Bob", age: 34 },
            { name: "Claire", age: 45 },
        ])

        const c: {
            name: string
            age: number
        }[] = shallowMap(shallowEvolve({ age: (age) => age + 1 }), user.friends)
        expect(c).toEqual([
            { name: "Bob", age: 34 },
            { name: "Claire", age: 45 },
        ])
    })

    it("has an adjust function", () => {
        const a: {
            name: string
            age: number
        }[] = shallowAdjust(0, { age: 55 }, user.friends)
        expect(a).toEqual([
            { name: "Bob", age: 55 },
            { name: "Claire", age: 44 },
        ])

        const b: {
            name: string
            age: number
        }[] = shallowAdjust(-1, { age: 55 }, user.friends)
        expect(b).toEqual([
            { name: "Bob", age: 33 },
            { name: "Claire", age: 55 },
        ])

        const c: {
            name: string
            age: number
        }[] = shallowAdjust(
            (user) => user.name === "Bob",
            { age: 55 },
            user.friends
        )
        expect(c).toEqual([
            { name: "Bob", age: 55 },
            { name: "Claire", age: 44 },
        ])

        const d: {
            name: string
            age: number
        }[] = shallowAdjust(
            0,
            (friend) => ({ ...friend, age: friend.age + 1 }),
            user.friends
        )
        expect(d).toEqual([
            { name: "Bob", age: 34 },
            { name: "Claire", age: 44 },
        ])
    })
})
