import { Future } from "@hazae41/future"
import { Awaitable } from "libs/promises/promises.js"

export class LockedError extends Error {
  readonly #class = LockedError
  readonly name = this.#class.name

  constructor() {
    super("Locked")
  }

}

/**
 * A releasable object
 */
export class Lock<T> {

  constructor(
    readonly inner: T,
    readonly release: () => void
  ) { }

  [Symbol.dispose]() {
    this.release()
  }

  get() {
    return this.inner
  }

}

/**
 * A semaphore with some reference and some capacity
 */
export class Semaphore<T, N extends number = number> {

  #queue = new Array<Future<void>>()
  #count = 0

  constructor(
    readonly inner: T,
    readonly capacity: N
  ) { }

  static void<N extends number>(capacity: N) {
    return new Semaphore<void, N>(undefined, capacity)
  }

  get locked() {
    return this.#count >= this.capacity
  }

  get count() {
    return this.#count
  }

  /**
   * Lock or throw an error
   * @param callback 
   */
  lockOrThrow<R>(callback: (inner: T) => Awaitable<R>): Promise<R> {
    if (this.#count >= this.capacity)
      throw new LockedError()

    this.#count++

    const promise = Promise.resolve()
      .then(() => callback(this.inner))
      .finally(() => this.#queue.shift()?.resolve())
      .finally(() => this.#count--)

    return promise
  }

  /**
   * Lock or wait
   * @param callback 
   */
  lockOrWait<R>(callback: (inner: T) => Awaitable<R>): Promise<R> {
    this.#count++

    if (this.#count > this.capacity) {
      const future = new Future<void>()
      this.#queue.push(future)

      const promise = future.promise
        .then(() => callback(this.inner))
        .finally(() => this.#queue.shift()?.resolve())
        .finally(() => this.#count--)

      return promise
    }

    const promise = Promise.resolve()
      .then(() => callback(this.inner))
      .finally(() => this.#queue.shift()?.resolve())
      .finally(() => this.#count--)

    return promise
  }

  /**
   * Just wait
   * @returns 
   */
  wait(): Promise<void> {
    const outer = new Future<void>()
    this.lockOrWait(() => outer.resolve())
    return outer.promise
  }

  /**
   * Lock and return a disposable object
   * @returns 
   */
  async acquire(): Promise<Lock<T>> {
    const outer = new Future<void>()
    const inner = new Future<void>()

    this.lockOrWait(() => { outer.resolve(); return inner.promise })

    await outer.promise

    return new Lock(this.inner, () => inner.resolve())
  }

}

/**
 * A semaphore but with a capacity of 1
 */
export class Mutex<T> {

  #semaphore: Semaphore<T, 1>

  constructor(
    readonly inner: T
  ) {
    this.#semaphore = new Semaphore(inner, 1)
  }

  static void() {
    return new Mutex<void>(undefined)
  }

  get locked() {
    return this.#semaphore.locked
  }

  lockOrThrow<R>(callback: (inner: T) => Awaitable<R>): Promise<R> {
    return this.#semaphore.lockOrThrow(callback)
  }

  lockOrWait<R>(callback: (inner: T) => Awaitable<R>): Promise<R> {
    return this.#semaphore.lockOrWait(callback)
  }

  wait(): Promise<void> {
    return this.#semaphore.wait()
  }

  async acquire(): Promise<Lock<T>> {
    return await this.#semaphore.acquire()
  }

}