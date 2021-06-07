import { Evolve, Unset } from "./interfaces"

/** sentinel value that will cause its key to be removed */
export const unset: Unset = () => {}

const toString = {}.toString,
    isObj = (o: any) => toString.call(o) === "[object Object]"

const baseEvolve = (patch: any, target: any) => {
    if (patch && isObj(patch)) {
        const newObject = isObj(target) ? { ...target } : {}
        Object.keys(patch).forEach((key) => {
            if (patch[key] === unset) delete newObject[key]
            else newObject[key] = baseEvolve(patch[key], newObject[key])
        })
        return newObject
    }
    return typeof patch === "function" ? patch(target) : patch
}

/** Merges changes from a patch object into a target object, the patch object can contain new values or functions to update values */
export const evolve: Evolve = (...args: any[]) => {
    if (!args.length) return evolve
    if (args.length === 1) return (target: any) => evolve(args[0], target)
    return baseEvolve(args[0], args[1])
}
evolve.poly = evolve
