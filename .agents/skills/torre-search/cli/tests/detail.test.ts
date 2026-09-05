import { describe, expect, test } from "bun:test"
import { extractTorreId } from "../src/helpers.js"

describe("detail arguments parsing", () => {
  test("validates opportunity ID extraction", () => {
    expect(extractTorreId("Yd6mq4kw")).toBe("Yd6mq4kw")
    expect(extractTorreId("https://torre.ai/post/Yd6mq4kw?source=share")).toBe("Yd6mq4kw")
  })
})
