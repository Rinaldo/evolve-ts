export type Unset = () => void

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

type EvaluatePatchForArgs<Patch> = Patch extends any[]
    ? Patch
    : Patch extends (...args: any[]) => any
    ? IfEquals<Unset, Patch, unknown, ReturnType<Patch>>
    : Patch extends { [key: string]: any }
    ? { [K in keyof Patch]?: EvaluatePatchForArgs<Patch[K]> } // everything optional here to avoid type errors as target has to extend patch, types will be checked more carefully in EvaluatePatchForReturn
    : Patch

type EvaluatePatchForReturn<Patch, Target> = Patch extends any[]
    ? Patch
    : Patch extends (...args: any[]) => any
    ? Unset extends Patch
        ? never
        : ReturnType<Patch>
    : Patch extends { [key: string]: any }
    ? string extends keyof Target // if target is an index type, return an index type of the patch excluding Unset
        ? {
              [key: string]: EvaluatePatchForReturn<
                  [Exclude<ValueOf<Patch>, Unset>] extends [never]
                      ? any
                      : Exclude<ValueOf<Patch>, Unset>,
                  unknown
              >
          }
        : Target extends { [key: string]: any }
        ? Id<
              {
                  [K in Exclude<
                      keyof Patch,
                      keyof Target
                  >]: EvaluatePatchForReturn<Patch[K], unknown> // unique keys in Patch
              } &
                  // if key is optional in target it should be typed as optional in patch to avoid type errors as target has to extend patch
                  Partial<
                      // filter out Unset keys in Patch if the corresponding key in target is optional, this allows unsetting optional keys without changing the type
                      FilterNeverKeys<
                          {
                              [K in OptionalKeys<
                                  Pick<Target, keyof Patch & keyof Target>
                              >]: IfEquals<
                                  Patch[K],
                                  Unset,
                                  never,
                                  EvaluatePatchForReturn<Patch[K], Target[K]>
                              >
                          }
                      >
                  > &
                  {
                      [K in RequiredKeys<
                          Pick<Target, keyof Patch & keyof Target>
                      >]: IfEquals<
                          Patch[K],
                          Unset,
                          never,
                          EvaluatePatchForReturn<Patch[K], Target[K]>
                      >
                  } // required keys in target
          >
        : {
              [K in keyof Patch]: Patch[K] extends Unset
                  ? never
                  : EvaluatePatchForReturn<Patch[K], unknown>
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
                      FilterNeverKeys<
                          {
                              [K in OptionalKeys<
                                  Pick<L, keyof L & keyof R>
                              >]: MergeLeft<L[K], R[K]>
                          }
                      >
                  > & // merge optional shared keys
                  FilterNeverKeys<
                      {
                          [K in RequiredKeys<
                              Pick<L, keyof L & keyof R>
                          >]: MergeLeft<L[K], R[K]>
                      }
                  > // merge required shared keys
          >
        : L
    : L

// looser typings on arguments to avoid type errors, tighter typings on return type using inferred target type as well as inferred patch type
// default to returning unknown if tighter typings fail
export interface Evolve {
    <Patch extends { [key: string]: any }>(patch: Patch): <
        Target extends EvaluatePatchForArgs<Patch>
    >(
        target: Target
    ) => MergeLeft<EvaluatePatchForReturn<Patch, Target>, Target> extends Target
        ? Target extends MergeLeft<
              EvaluatePatchForReturn<Patch, Target>,
              Target
          >
            ? Target
            : unknown
        : unknown
    <
        Patch extends { [key: string]: any },
        Target extends EvaluatePatchForArgs<Patch>
    >(
        patch: Patch,
        target: Target
    ): MergeLeft<EvaluatePatchForReturn<Patch, Target>, Target> extends Target
        ? Target extends MergeLeft<
              EvaluatePatchForReturn<Patch, Target>,
              Target
          >
            ? Target
            : unknown
        : unknown
    poly: {
        <Patch extends { [key: string]: any }>(patch: Patch): <Target>(
            target: Target
        ) => MergeLeft<EvaluatePatchForReturn<Patch, Target>, Target>
        <Patch extends { [key: string]: any }, Target>(
            patch: Patch,
            target: Target
        ): MergeLeft<EvaluatePatchForReturn<Patch, Target>, Target>
    }
}
