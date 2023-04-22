export class Mutex<T> {

  #promise?: Promise<void>

  #inner: T

  /**
   * Just a mutex
   */
  constructor(
    inner: T
  ) {
    this.#inner = inner
  }

  /**
   * Lock this mutex
   * @param callback 
   * @returns 
   */
  lock<R>(callback: (inner: T) => Promise<R>) {
    const promise = this.#promise
      ? this.#promise.then(() => callback(this.#inner))
      : callback(this.#inner)

    this.#promise = promise
      .then(() => { })
      .catch(() => { })
      .finally(() => this.#promise = undefined)

    return promise
  }

  /**
   * Try to lock this mutex, returns undefined if already locked
   * @param callback 
   * @returns 
   */
  tryLock<R>(callback: (inner: T) => Promise<R>) {
    if (this.#promise)
      throw new Error(`Could not lock mutex`)

    const promise = callback(this.#inner)

    this.#promise = promise
      .then(() => { })
      .catch(() => { })
      .finally(() => this.#promise = undefined)

    return promise
  }

}