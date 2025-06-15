import { Deferred, Ref } from "@hazae41/box"
import { Future } from "@hazae41/future"
import { Awaitable } from "libs/awaitable/index.js"
import { Nullable } from "libs/nullable/index.js"

export class LockedError extends Error {
  readonly #class = LockedError
  readonly name = this.#class.name

  constructor() {
    super("Locked")
  }

}

/**
 * A limited counter
 */
export class Semaphore<T, N extends number = number> {

  #queue = new Array<Future<void>>()

  #count = 0

  constructor(
    readonly value: T,
    readonly limit: N
  ) { }

  [Symbol.dispose](this: Semaphore<Disposable, N>) {
    this.value[Symbol.dispose]()
  }

  async [Symbol.asyncDispose](this: Semaphore<AsyncDisposable, N>) {
    await this.value[Symbol.asyncDispose]()
  }

  get count() {
    return this.#count
  }

  get locked() {
    return this.#count >= this.limit
  }

  get() {
    return this.value
  }

  getOrNull(): Nullable<T> {
    if (this.#count >= this.limit)
      return
    return this.value
  }

  getOrThrow(): T {
    if (this.#count >= this.limit)
      throw new LockedError()
    return this.value
  }

  async wait() {
    this.#count++

    if (this.#count > this.limit) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    this.#count--
    this.#queue.shift()?.resolve()
  }

  lockOrNull(): Nullable<Ref<T>> {
    if (this.#count >= this.limit)
      return

    this.#count++

    const dispose = () => {
      this.#count--
      this.#queue.shift()?.resolve()
    }

    return new Ref(this.value, new Deferred(dispose))
  }

  /**
   * Get and lock or throw
   * @returns 
   */
  lockOrThrow(): Ref<T> {
    if (this.#count >= this.limit)
      throw new LockedError()

    this.#count++

    const dispose = () => {
      this.#count--
      this.#queue.shift()?.resolve()
    }

    return new Ref(this.value, new Deferred(dispose))
  }

  /**
   * Get and lock or wait
   * @returns 
   */
  async lockOrWait(): Promise<Ref<T>> {
    this.#count++

    if (this.#count > this.limit) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    const dispose = () => {
      this.#count--
      this.#queue.shift()?.resolve()
    }

    return new Ref(this.value, new Deferred(dispose))
  }

  /**
   * @deprecated
   * @param callback 
   * @returns 
   */
  async runOrThrow<R>(callback: (value: T) => Awaitable<R>): Promise<R> {
    if (this.#count >= this.limit)
      throw new LockedError()

    this.#count++

    try {
      return await callback(this.value)
    } finally {
      this.#count--
      this.#queue.shift()?.resolve()
    }
  }

  /**
   * @deprecated
   * @param callback 
   * @returns 
   */
  async runOrWait<R>(callback: (value: T) => Awaitable<R>): Promise<R> {
    this.#count++

    if (this.#count > this.limit) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    try {
      return await callback(this.value)
    } finally {
      this.#count--
      this.#queue.shift()?.resolve()
    }
  }

}

/**
 * A semaphore but with a limit of 1
 */
export class Mutex<T> {

  #queue = new Array<Future<void>>()

  #count = 0

  constructor(
    readonly value: T
  ) { }

  [Symbol.dispose](this: Mutex<Disposable>) {
    this.value[Symbol.dispose]()
  }

  async [Symbol.asyncDispose](this: Mutex<AsyncDisposable>) {
    await this.value[Symbol.asyncDispose]()
  }

  get count() {
    return this.#count
  }

  get locked() {
    return this.#count >= 1
  }

  get() {
    return this.value
  }

  getOrNull(): Nullable<T> {
    if (this.#count >= 1)
      return
    return this.value
  }

  getOrThrow(): T {
    if (this.#count >= 1)
      throw new LockedError()
    return this.value
  }

  async wait() {
    this.#count++

    if (this.#count > 1) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    this.#count--
    this.#queue.shift()?.resolve()
  }

  lockOrNull(): Nullable<Ref<T>> {
    if (this.#count >= 1)
      return

    this.#count++

    const dispose = () => {
      this.#count--
      this.#queue.shift()?.resolve()
    }

    return new Ref(this.value, new Deferred(dispose))
  }

  /**
   * Get and lock or throw
   * @returns 
   */
  lockOrThrow(): Ref<T> {
    if (this.#count >= 1)
      throw new LockedError()

    this.#count++

    const dispose = () => {
      this.#count--
      this.#queue.shift()?.resolve()
    }

    return new Ref(this.value, new Deferred(dispose))
  }

  /**
   * Get and lock or wait
   * @returns 
   */
  async lockOrWait(): Promise<Ref<T>> {
    this.#count++

    if (this.#count > 1) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    const dispose = () => {
      this.#count--
      this.#queue.shift()?.resolve()
    }

    return new Ref(this.value, new Deferred(dispose))
  }

  /**
   * @deprecated
   * @param callback 
   * @returns 
   */
  async runOrThrow<R>(callback: (value: T) => Awaitable<R>): Promise<R> {
    if (this.#count >= 1)
      throw new LockedError()

    this.#count++

    try {
      return await callback(this.value)
    } finally {
      this.#count--
      this.#queue.shift()?.resolve()
    }
  }

  /**
   * @deprecated
   * @param callback 
   * @returns 
   */
  async runOrWait<R>(callback: (value: T) => Awaitable<R>): Promise<R> {
    this.#count++

    if (this.#count > 1) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    try {
      return await callback(this.value)
    } finally {
      this.#count--
      this.#queue.shift()?.resolve()
    }
  }

}