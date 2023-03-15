import {
    Adjust,
    Evolve,
    Evolve_,
    MapArray,
    ShallowEvolve,
    ShallowAdjust,
    ShallowMapArray,
    unset,
} from "./interfaces"
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
        // shave bytes by reassigning, but not mutating, arguments
        target = isObj(target) ? { ...target } : {}
        Object.keys(patch).forEach((key) => {
            if (patch[key] == unset) delete target[key]
            else target[key] = baseEvolve(patch[key], target[key])
        })
        return target
    } else if (isFn(patch)) {
        return patch(target)
    } else {
        return patch
    }
}

/** deeply merges changes from a patch object into a target object, the patch object can contain new values or functions to update values */
export const evolve = curry(baseEvolve) as Evolve

/** polymorphic type alias for evolve: deeply merges changes from a patch object into a target object, the patch object can contain new values or functions to update values */
export const evolve_: Evolve_ = evolve

const baseShallowEvolve = (patch: any, target: any) => {
    // shave bytes by reassigning, but not mutating, arguments
    target = { ...target }
    Object.keys(patch).forEach((key) => {
        const update = patch[key]
        if (update == unset) delete target[key]
        else target[key] = isFn(update) ? update(target[key]) : update
    })
    return target
}

/** merges changes from a patch object into a target object, the patch object can contain new values or functions to update values */
export const shallowEvolve = curry(baseShallowEvolve) as ShallowEvolve

const createAdjust =
    (ev: any) => (predicateOrIndex: any, updaterOrPatch: any, array: any[]) => {
        // shave bytes by reassigning, but not mutating, arguments
        if (!isFn(updaterOrPatch)) {
            updaterOrPatch = ev(updaterOrPatch)
        }
        // track if any item was changed
        let changed
        const updater = (item: any) => ((changed = 1), updaterOrPatch(item))
        if (predicateOrIndex < 0) {
            // allow using negative indexes as offsets from end
            predicateOrIndex = array.length + predicateOrIndex
        }

        const mapped = array.map(
            isFn(predicateOrIndex)
                ? (item) => (predicateOrIndex(item) ? updater(item) : item)
                : (item, i) => (i === predicateOrIndex ? updater(item) : item)
        )
        return changed ? mapped : array
    }

/** conditionally maps values in an array with a callback function or patch. Value(s) to map can be specified with an index or predicate function. Negative indexes are treated as offsets from the array length */
export const adjust: Adjust = curry(createAdjust(evolve))

/** conditionally maps values in an array with a callback function or patch. Value(s) to map can be specified with an index or predicate function. Negative indexes are treated as offsets from the array length */
export const shallowAdjust: ShallowAdjust = curry(createAdjust(shallowEvolve))

const createMap = (ev: any) => (updaterOrPatch: any, array: any[]) =>
    array.map(
        isFn(updaterOrPatch)
            ? (item: any) => updaterOrPatch(item) // clamp args to 1
            : ev(updaterOrPatch)
    )

/** maps values in an array with a callback function or patch */
export const map: MapArray = curry(createMap(evolve))

/** maps values in an array with a callback function or patch */
export const shallowMap: ShallowMapArray = curry(createMap(shallowEvolve))
