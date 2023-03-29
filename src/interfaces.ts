class Unset {} // using class so the type will be unique

/** sentinel value that will cause its key to be removed */
export const unset = Unset

type Unarray<T> = T extends Array<infer U> ? U : T

type OptionalKeysHelper<T> = {
    [K in keyof T]-?: Record<string, unknown> extends Pick<T, K> ? K : never
}[keyof T]
type IsOptional<T, K> = string extends keyof T // all keys are optional in an index type
    ? true
    : [OptionalKeysHelper<T>] extends [never] // if no optional keys in type, false
    ? false
    : K extends OptionalKeysHelper<T>
    ? true
    : false

export type Patch<Target extends { [key: string]: any }> = {
    [K in keyof Target]?: Target[K] extends any[]
        ? IsOptional<Target, K> extends true
            ?
                  | Target[K]
                  | ((value: Target[K]) => Target[K] | typeof Unset)
                  | typeof Unset
            : Target[K] | ((value: Target[K]) => Target[K])
        : Target[K] extends { [key: string]: any }
        ? IsOptional<Target, K> extends true
            ?
                  | Target[K]
                  | ((value: Target[K]) => Target[K] | typeof Unset)
                  | typeof Unset
                  | Patch<Target[K]>
            : Target[K] | ((value: Target[K]) => Target[K]) | Patch<Target[K]>
        : IsOptional<Target, K> extends true
        ?
              | Target[K]
              | ((value: Target[K]) => Target[K] | typeof Unset)
              | typeof Unset
        : Target[K] | ((value: Target[K]) => Target[K])
}

export type ShallowPatch<Target extends { [key: string]: any }> = {
    [K in keyof Target]?: IsOptional<Target, K> extends true
        ?
              | Target[K]
              | ((value: Target[K]) => Target[K] | typeof Unset)
              | typeof Unset
        : Target[K] | ((value: Target[K]) => Target[K])
}

export interface Evolve {
    <Context>(
        patch: Patch<
            Context extends (...args: infer Param) => any
                ? Param
                : Context extends { [key: string]: any }
                ? Context
                : never
        >
    ): Context extends (...args: any) => any
        ? Context
        : (target: Context) => Context
    <Target extends { [key: string]: any }>(patch: Patch<Target>): (
        target: Target
    ) => Target // needed for using evolve within patch, not sure why...
    <Target extends { [key: string]: any }>(
        patch: Patch<Target>,
        target: Target
    ): Target
}

export interface ShallowEvolve {
    <Context>(
        patch: ShallowPatch<
            Context extends (...args: infer Param) => any
                ? Param
                : Context extends { [key: string]: any }
                ? Context
                : never
        >
    ): Context extends (...args: any) => any
        ? Context
        : (target: Context) => Context
    <Target extends { [key: string]: any }>(patch: ShallowPatch<Target>): (
        target: Target
    ) => Target // needed for using evolve within patch, not sure why...
    <Target extends { [key: string]: any }>(
        patch: ShallowPatch<Target>,
        target: Target
    ): Target
}

export interface Adjust {
    /** curried form for use within evolve or setState */
    <Arr extends any[]>(
        indexOrPredicate: number | ((item: Unarray<Arr>) => any),
        patchOrUpdater:
            | Patch<Unarray<Arr>>
            | ((item: Unarray<Arr>) => Unarray<Arr>)
    ): (array: Arr) => Arr
    /** uncurried form and explicit array type */
    <Arr extends any[]>(
        indexOrPredicate: number | ((item: Unarray<Arr>) => any),
        patchOrUpdater:
            | Patch<Unarray<Arr>>
            | ((item: Unarray<Arr>) => Unarray<Arr>),
        array: Arr
    ): Arr
}

export interface ShallowAdjust {
    /** curried form for use within evolve or setState */
    <Arr extends any[]>(
        indexOrPredicate: number | ((item: Unarray<Arr>) => any),
        patchOrUpdater:
            | ShallowPatch<Unarray<Arr>>
            | ((item: Unarray<Arr>) => Unarray<Arr>)
    ): (array: Arr) => Arr
    /** uncurried form and explicit array type */
    <Arr extends any[]>(
        indexOrPredicate: number | ((item: Unarray<Arr>) => any),
        patchOrUpdater:
            | ShallowPatch<Unarray<Arr>>
            | ((item: Unarray<Arr>) => Unarray<Arr>),
        array: Arr
    ): Arr
}

export interface MapArray {
    /** curried form for use within evolve or setState */
    <Arr extends any[]>(
        patchOrUpdater:
            | Patch<Unarray<Arr>>
            | ((item: Unarray<Arr>) => Unarray<Arr>)
    ): (array: Arr) => Arr
    /** uncurried form and explicit array type */
    <Arr extends any[]>(
        patchOrUpdater:
            | Patch<Unarray<Arr>>
            | ((item: Unarray<Arr>) => Unarray<Arr>),
        array: Arr
    ): Arr
}

export interface ShallowMapArray {
    /** curried form for use within evolve or setState */
    <Arr extends any[]>(
        patchOrUpdater:
            | ShallowPatch<Unarray<Arr>>
            | ((item: Unarray<Arr>) => Unarray<Arr>)
    ): (array: Arr) => Arr
    /** uncurried form and explicit array type */
    <Arr extends any[]>(
        patchOrUpdater:
            | ShallowPatch<Unarray<Arr>>
            | ((item: Unarray<Arr>) => Unarray<Arr>),
        array: Arr
    ): Arr
}

export interface Evolve_ {
    <Patch extends { [key: string]: any }>(patch: Patch): <Target>(
        target: Target
    ) => MergeLeft<ParsePatch<Patch, Target>, Target>
    <Patch extends { [key: string]: any }, Target>(
        patch: Patch,
        target: Target
    ): MergeLeft<ParsePatch<Patch, Target>, Target>
}

type ValueOf<T> = T[keyof T]
type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never
type NonNeverKeys<T extends { [key: string]: any }> = {
    [K in keyof T]: T[K] extends never ? never : K
}[keyof T]
type FilterNeverKeys<T extends { [key: string]: any }> = {
    [K in NonNeverKeys<T>]: T[K]
}

type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T]
type RequiredKeys<T> = Exclude<
    KeysOfType<T, Exclude<T[keyof T], undefined>>,
    undefined
>
type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>

type IfEquals<A, B, T, F> = A extends B ? (B extends A ? T : F) : F

type ParsePatch<Patch, Target> = Patch extends any[]
    ? Patch
    : Patch extends (...args: any[]) => any
    ? Exclude<ReturnType<Patch>, typeof Unset>
    : Patch extends typeof Unset
    ? never
    : Patch extends { [key: string]: any }
    ? string extends keyof Target // if target is an index type, return an index type of the patch excluding Unset
        ? {
              [key: string]: ParsePatch<
                  [Exclude<ValueOf<Patch>, Unset>] extends [never]
                      ? any
                      : Exclude<ValueOf<Patch>, Unset>,
                  unknown
              >
          }
        : Target extends { [key: string]: any }
        ? Id<
              {
                  [K in Exclude<keyof Patch, keyof Target>]: ParsePatch<
                      Patch[K],
                      unknown
                  > // unique keys in Patch
              } & Partial<
                  // if key is optional in target it should be typed as optional in patch to avoid type errors as target has to extend patch
                  // filter out Unset keys in Patch if the corresponding key in target is optional, this allows unsetting optional keys without changing the type
                  FilterNeverKeys<{
                      [K in OptionalKeys<
                          Pick<Target, keyof Patch & keyof Target>
                      >]: IfEquals<
                          Patch[K],
                          Unset,
                          never,
                          ParsePatch<Patch[K], Target[K]>
                      >
                  }>
              > & {
                      [K in RequiredKeys<
                          Pick<Target, keyof Patch & keyof Target>
                      >]: IfEquals<
                          Patch[K],
                          Unset,
                          never,
                          ParsePatch<Patch[K], Target[K]>
                      >
                  } // required keys in target
          >
        : {
              [K in keyof Patch]: Patch[K] extends Unset
                  ? never
                  : ParsePatch<Patch[K], unknown>
          }
    : Patch

export type MergeLeft<L, R> = L extends any[]
    ? L
    : string extends keyof L
    ? string extends keyof R
        ? { [key: string]: MergeLeft<ValueOf<L>, ValueOf<R>> }
        : R extends { [key: string]: any }
        ? { [key: string]: ValueOf<L> | ValueOf<R> }
        : L
    : L extends { [key: string]: any }
    ? string extends keyof R
        ? { [key: string]: ValueOf<L> | ValueOf<R> }
        : R extends { [key: string]: any }
        ? Id<
              Pick<R, Exclude<keyof R, keyof L>> & // unique keys in R
                  Pick<L, Exclude<keyof L, keyof R>> & // unique keys in L
                  Partial<
                      FilterNeverKeys<{
                          [K in OptionalKeys<
                              Pick<L, keyof L & keyof R>
                          >]: MergeLeft<L[K], R[K]>
                      }>
                  > & // merge optional shared keys
                  FilterNeverKeys<{
                      [K in RequiredKeys<
                          Pick<L, keyof L & keyof R>
                      >]: MergeLeft<L[K], R[K]>
                  }> // merge required shared keys
          >
        : L
    : L extends R
    ? R
    : L // prevent type narrowing
