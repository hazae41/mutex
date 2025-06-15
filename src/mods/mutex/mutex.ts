import { Deferred, Void, Wrap } from "@hazae41/box"
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
 * Unlimited counter
 */
export class Counter<T> {

  #count = 0

  constructor(
    readonly value: T,
    readonly clean: Disposable
  ) { }

  static void() {
    return new Counter<void>(undefined, new Void())
  }

  static wrap<T extends Disposable>(value: T) {
    return new Counter(value, value)
  }

  static from<T>(value: Wrap<T>) {
    return new Counter(value.get(), value)
  }

  static with<T>(value: T, clean: (value: T) => void) {
    return new Counter(value, new Deferred(() => clean(value)))
  }

  [Symbol.dispose]() {
    if (this.count === 0)
      return

    this.#count--

    if (this.#count > 0)
      return

    this.clean[Symbol.dispose]()
  }

  async [Symbol.asyncDispose]() {
    this[Symbol.dispose]()
  }

  get count() {
    return this.#count
  }

  get() {
    return this.value
  }

  clone() {
    this.#count++
    return this
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
    readonly clean: Disposable,
    readonly limit: N
  ) { }

  static void<N extends number>(limit: N) {
    return new Semaphore<void, N>(undefined, new Void(), limit)
  }

  static wrap<T extends Disposable, N extends number>(value: T, limit: N) {
    return new Semaphore<T, N>(value, value, limit)
  }

  static from<T, N extends number>(value: Wrap<T>, limit: N) {
    return new Semaphore<T, N>(value.get(), value, limit)
  }

  static with<T, N extends number>(value: T, clean: (value: T) => void, limit: N) {
    return new Semaphore<T, N>(value, new Deferred(() => clean(value)), limit)
  }

  [Symbol.dispose]() {
    if (this.count === 0)
      return

    this.#count--

    this.#queue.shift()?.resolve()

    if (this.#count > 0)
      return

    this.clean[Symbol.dispose]()
  }

  async [Symbol.asyncDispose]() {
    this[Symbol.dispose]()
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

    this[Symbol.dispose]()
  }

  cloneOrNull(): Nullable<this> {
    if (this.#count >= this.limit)
      return

    this.#count++

    return this
  }

  /**
   * Get and lock or throw
   * @returns 
   */
  cloneOrThrow(): this {
    if (this.#count >= this.limit)
      throw new LockedError()

    this.#count++

    return this
  }

  /**
   * Get and lock or wait
   * @returns 
   */
  async cloneOrWait(): Promise<this> {
    this.#count++

    if (this.#count > this.limit) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    return this
  }

  /**
   * @deprecated
   * @param callback 
   * @returns 
   */
  async runOrThrow<R>(callback: (value: T) => Awaitable<R>): Promise<R> {
    using _ = this.cloneOrThrow()
    return await callback(this.value)
  }

  /**
   * @deprecated
   * @param callback 
   * @returns 
   */
  async runOrWait<R>(callback: (value: T) => Awaitable<R>): Promise<R> {
    using _ = await this.cloneOrWait()
    return await callback(this.value)
  }

}

/**
 * A semaphore but with a limit of 1
 */
export class Mutex<T> {

  #queue = new Array<Future<void>>()

  #count = 0

  constructor(
    readonly value: T,
    readonly clean: Disposable
  ) { }

  static void() {
    return new Mutex<void>(undefined, new Void())
  }

  static wrap<T extends Disposable>(value: T) {
    return new Mutex<T>(value, value)
  }

  static from<T>(value: Wrap<T>) {
    return new Mutex<T>(value.get(), value)
  }

  static with<T>(value: T, clean: (value: T) => void) {
    return new Mutex<T>(value, new Deferred(() => clean(value)))
  }

  [Symbol.dispose]() {
    if (this.count === 0)
      return

    this.#count--

    this.#queue.shift()?.resolve()

    if (this.#count > 0)
      return

    this.clean[Symbol.dispose]()
  }

  async [Symbol.asyncDispose]() {
    this[Symbol.dispose]()
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

    this[Symbol.dispose]()
  }

  cloneOrNull(): Nullable<this> {
    if (this.#count >= 1)
      return

    this.#count++

    return this
  }

  /**
   * Get and lock or throw
   * @returns 
   */
  cloneOrThrow(): this {
    if (this.#count >= 1)
      throw new LockedError()

    this.#count++

    return this
  }

  /**
   * Get and lock or wait
   * @returns 
   */
  async cloneOrWait(): Promise<this> {
    this.#count++

    if (this.#count > 1) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    return this
  }

  /**
   * @deprecated
   * @param callback 
   * @returns 
   */
  async runOrThrow<R>(callback: (value: T) => Awaitable<R>): Promise<R> {
    using _ = this.cloneOrThrow()
    return await callback(this.value)
  }

  /**
   * @deprecated
   * @param callback 
   * @returns 
   */
  async runOrWait<R>(callback: (value: T) => Awaitable<R>): Promise<R> {
    using _ = await this.cloneOrWait()
    return await callback(this.value)
  }

}