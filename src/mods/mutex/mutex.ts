import { Future } from "@hazae41/future"
import { Err, Ok, Result } from "@hazae41/result"
import { Awaitable } from "libs/promises/promises.js"

export type MutexError =
  | MutexLockError

export class MutexLockError extends Error {
  readonly #class = MutexLockError
  readonly name = this.#class.name

  constructor() {
    super(`Could not lock mutex`)
  }

}

export class Mutex<T> {

  promise?: Promise<void>

  /**
   * Just a mutex
   */
  constructor(
    readonly inner: T
  ) { }

  get locked() {
    return this.promise != null
  }

  acquire(): Awaitable<Lock<T>> {
    const future = new Future<void>()
    const promise = this.promise
    this.lock(() => future.promise)

    const release = () => future.resolve()
    const access = new Lock(this.inner, release)

    return promise
      ? promise.then(() => access)
      : access
  }

  /**
   * Lock this mutex
   * @param callback 
   * @returns 
   */
  lock<R>(callback: (inner: T) => Promise<R>): Promise<R> {
    const promise = this.promise
      ? this.promise.then(() => callback(this.inner))
      : callback(this.inner)

    const pure = promise
      .then(() => { })
      .catch(() => { })
    this.promise = pure

    pure.finally(() => {
      if (this.promise !== pure)
        return
      this.promise = undefined
    })

    return promise
  }

  /**
   * Lock this mutex or throw error
   * @param callback 
   * @returns 
   */
  lockOrThrow<R>(callback: (inner: T) => Promise<R>): Promise<R> {
    if (!this.locked)
      return this.lock(callback)
    throw new MutexLockError()
  }

  /**
   * Lock this mutex or return error
   * @param callback 
   * @returns 
   */
  tryLock<R>(callback: (inner: T) => Promise<R>): Result<Promise<R>, MutexLockError> {
    if (!this.locked)
      return new Ok(this.lock(callback))
    return new Err(new MutexLockError())
  }

}

export class Lock<T> {

  constructor(
    readonly inner: T,
    readonly release: () => void
  ) { }

  [Symbol.dispose]() {
    this.release()
  }

}