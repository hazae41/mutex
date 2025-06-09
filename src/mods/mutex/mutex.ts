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
    readonly value: T,
    readonly dispose: () => void
  ) { }

  [Symbol.dispose]() {
    this.dispose()
  }

  get() {
    return this.value
  }

}

/**
 * A semaphore with some reference and some capacity
 */
export class Semaphore<T, N extends number = number> {

  #queue = new Array<Future<void>>()
  #count = 0

  constructor(
    readonly value: T,
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

  get() {
    return this.value
  }

  throw() {
    if (!this.locked)
      return
    throw new LockedError()
  }

  async wait() {
    this.#count++

    if (this.#count > this.capacity) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    this.#queue.shift()?.resolve()
    this.#count--
  }

  /**
   * Get and lock or throw
   * @returns 
   */
  async getOrThrow(): Promise<Lock<T>> {
    if (this.locked)
      throw new LockedError()

    this.#count++

    const release = () => {
      this.#queue.shift()?.resolve()
      this.#count--
    }

    return new Lock(this.value, release)
  }

  /**
   * Get and lock or wait
   * @returns 
   */
  async getOrWait(): Promise<Lock<T>> {
    this.#count++

    if (this.#count > this.capacity) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    const release = () => {
      this.#queue.shift()?.resolve()
      this.#count--
    }

    return new Lock(this.value, release)
  }

  /**
   * Run and lock or throw
   * @param callback 
   */
  async runOrThrow<R>(callback: (inner: T) => Awaitable<R>): Promise<R> {
    if (this.locked)
      throw new LockedError()

    this.#count++

    try {
      return await callback(this.value)
    } finally {
      this.#queue.shift()?.resolve()
      this.#count--
    }
  }

  /**
   * Run and lock or wait
   * @param callback 
   */
  async runOrWait<R>(callback: (inner: T) => Awaitable<R>): Promise<R> {
    this.#count++

    if (this.#count > this.capacity) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    try {
      return await callback(this.value)
    } finally {
      this.#queue.shift()?.resolve()
      this.#count--
    }
  }

}

/**
 * A semaphore but with a capacity of 1
 */
export class Mutex<T> {

  #semaphore: Semaphore<T, 1>

  constructor(
    readonly value: T
  ) {
    this.#semaphore = new Semaphore(value, 1)
  }

  static void() {
    return new Mutex<void>(undefined)
  }

  get locked() {
    return this.#semaphore.locked
  }

  get() {
    return this.value
  }

  throw() {
    this.#semaphore.throw()
  }

  async wait() {
    await this.#semaphore.wait()
  }

  async getOrThrow(): Promise<Lock<T>> {
    return await this.#semaphore.getOrThrow()
  }

  async getOrWait(): Promise<Lock<T>> {
    return await this.#semaphore.getOrWait()
  }

  async runOrThrow<R>(callback: (inner: T) => Awaitable<R>): Promise<R> {
    return await this.#semaphore.runOrThrow(callback)
  }

  async runOrWait<R>(callback: (inner: T) => Awaitable<R>): Promise<R> {
    return await this.#semaphore.runOrWait(callback)
  }

}