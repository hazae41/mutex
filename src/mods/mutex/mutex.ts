export class Mutex {

  #promise?: Promise<void>

  /**
   * Just a mutex
   */
  constructor() { }

  /**
   * Lock this mutex
   * @param callback 
   * @returns 
   */
  lock<T>(callback: () => Promise<T>) {
    return this.#promise
      ? this.#promise.then(() => this.#lockSync(callback))
      : this.#lockSync(callback)
  }

  #lockSync<T>(callback: () => Promise<T>) {
    const promise = callback()

    this.#promise = promise
      .then(() => { })
      .catch(() => { })

    return promise
  }

  get promise() {
    return this.#promise
  }

}