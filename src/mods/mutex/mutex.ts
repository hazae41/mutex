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
  async lock<T>(callback: () => Promise<T>) {
    if (this.#promise)
      await this.#promise

    const promise = callback()

    this.#promise = promise
      .then(() => { })
      .catch(() => { })

    return await promise
  }

  get promise() {
    return this.#promise
  }

}