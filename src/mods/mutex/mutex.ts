import { Err, Ok, Result } from "@hazae41/result"

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
  lock<R>(callback: (inner: T) => Promise<R>) {
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
  tryLock<R>(callback: (inner: T) => Promise<R>): Result<Promise<R>, Error> {
    if (this.#promise)
      return new Err(new Error(`Could not lock mutex`))

    const promise = callback(this.inner)

    this.#promise = promise
      .then(() => { })
      .catch(() => { })
      .finally(() => this.#promise = undefined)

    return new Ok(promise)
  }

}