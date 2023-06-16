import { Err, Ok, Result } from "@hazae41/result"

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

  #promise?: Promise<void>

  /**
   * Just a mutex
   */
  constructor(
    readonly inner: T
  ) { }

  get locked() {
    return Boolean(this.#promise)
  }

  /**
   * Lock this mutex
   * @param callback 
   * @returns 
   */
  lock<R>(callback: (inner: T) => Promise<R>): Promise<R> {
    const promise = this.#promise
      ? this.#promise.then(() => callback(this.inner))
      : callback(this.inner)

    this.#promise = promise
      .then(() => { })
      .catch(() => { })
      .finally(() => this.#promise = undefined)

    return promise
  }

  /**
   * Try to lock this mutex
   * @param callback 
   * @returns 
   */
  tryLock<R>(callback: (inner: T) => Promise<R>): Result<Promise<R>, MutexLockError> {
    if (this.#promise)
      return new Err(new MutexLockError())

    const promise = callback(this.inner)

    this.#promise = promise
      .then(() => { })
      .catch(() => { })
      .finally(() => this.#promise = undefined)

    return new Ok(promise)
  }

}