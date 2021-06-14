import { Adjust, Evolve, Evolve_, MapArray, unset } from "./interfaces"
export * from "./interfaces"

const toString = {}.toString
const isObj = (o: any) => toString.call(o) === "[object Object]"
const isFn = (x: any): x is (...args: any[]) => any => typeof x === "function"
const curry =
    (fn: (...args: any[]) => any) =>
    (...args: any[]) =>
        args.length < fn.length
            ? (...moreArgs: any[]) => curry(fn)(...args, ...moreArgs)
            : fn(...args)

const baseEvolve = (patch: any, target: any) => {
    if (patch && isObj(patch)) {
        const newObject = isObj(target) ? { ...target } : {}
        Object.keys(patch).forEach((key) => {
            if (patch[key] === unset) delete newObject[key]
            else newObject[key] = baseEvolve(patch[key], newObject[key])
        })
        return newObject
    } else if (isFn(patch)) {
        return patch(target)
    } else {
        return patch
    }
}

/** merges changes from a patch object into a target object, the patch object can contain new values or functions to update values */
export const evolve = curry(baseEvolve) as Evolve
evolve.poly = evolve

/** polymorphic type alias for evolve: merges changes from a patch object into a target object, the patch object can contain new values or functions to update values */
export const evolve_: Evolve_ = evolve

const baseAdjust = (
    predicateOrIndex: any,
    updaterOrPatch: any,
    array: any[]
) => {
    const updater = isFn(updaterOrPatch)
        ? updaterOrPatch
        : evolve(updaterOrPatch)

    if (predicateOrIndex < 0) {
        // allow using negative indexes as offsets from end
        predicateOrIndex = array.length + predicateOrIndex
    }

    return array.map(
        isFn(predicateOrIndex)
            ? (item) => (predicateOrIndex(item) ? updater(item) : item)
            : (item, i) => (i === predicateOrIndex ? updater(item) : item)
    )
}

/** conditionally maps values in an array with a callback function or patch. Value(s) to map can be specified with an index or predicate function. Negative indexes are treated as offsets from the array length */
export const adjust: Adjust = curry(baseAdjust)

const baseMap = (updaterOrPatch: any, array: any[]) =>
    array.map(
        isFn(updaterOrPatch)
            ? (item: any) => updaterOrPatch(item) // clamp args to 1
            : evolve(updaterOrPatch)
    )

/** maps values in an array with a callback function or patch */
export const map: MapArray = curry(baseMap)
