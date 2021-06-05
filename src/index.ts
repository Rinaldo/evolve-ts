/** sentinel value that will cause its key to be removed */
export const unset = (): unknown => null

const toString = {}.toString, isObj = (o: any) => toString.call(o) === "[object Object]"

const baseEvolve = (patch: any, target: any) => {
    if (patch && isObj(patch)) {
        const newObject = isObj(target) ? { ...target } : {}
        Object.keys(patch).forEach(key => {
            if (patch[key] === unset) delete newObject[key]
            else newObject[key] = baseEvolve(patch[key], newObject[key])
        })
        return newObject
    }
    return typeof patch === "function" ? patch(target) : patch
}

type ApplyPatch<T> = T extends any[]
    ? T
    : T extends (...args: any[]) => any
    ? ReturnType<T>
    : T extends { [key: string]: any }
    ? { [K in keyof T]: ApplyPatch<T[K]> }
    : T

type ValueOf<T> = T[keyof T]
type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never
type NonNeverKeys<T extends { [key: string]: any }> = { [K in keyof T]: T[K] extends never ? never : K }[keyof T]
type FilterNeverKeys<T extends { [key: string]: any }> = { [K in NonNeverKeys<T>]: T[K] }

export type MergeLeft<L, R> = L extends any[]
    ? L
    : string extends keyof L
        ? string extends keyof R
            ? { [key: string]: MergeLeft<ValueOf<L>, ValueOf<R>>}
            : L
    : L extends { [key: string]: any }
        ? R extends { [key: string]: any }
            ? Id<
                Pick<R, Exclude<keyof R, keyof L>> &
                Pick<L, Exclude<keyof L, keyof R>> &
                FilterNeverKeys<{ [K in keyof R & keyof L]: MergeLeft<L[K], R[K]> }>
            >
            : L
    : L

export interface Evolve {
    <Patch extends { [key: string]: any }>(patch: Patch): <Target extends ApplyPatch<Patch>>(target: Target) => Target
    <Patch extends { [key: string]: any }, Target extends ApplyPatch<Patch>>(patch: Patch, target: Target): Target
    poly: {
        <Patch extends { [key: string]: any }>(patch: Patch): <Target>(target: Target) => MergeLeft<ApplyPatch<Patch>, Target>
        <Patch extends { [key: string]: any }, Target>(patch: Patch, target: Target): MergeLeft<ApplyPatch<Patch>, Target>
    }
}
/** Merges changes from a patch object into a target object, the patch object can contain new values or functions to update values */
export const evolve: Evolve = (...args: any[]) => {
    if (!args.length) return evolve
    if (args.length === 1) return (target: any) => evolve(args[0], target)
    return baseEvolve(args[0], args[1]) as any
}
evolve.poly = evolve
