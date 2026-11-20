import { jest } from '@jest/globals'

type Params = Record<string, unknown>
type Response = Promise<{ data: unknown }>

export const listMatchingRefs = jest.fn<(params: Params) => Response>()
export const generateReleaseNotes = jest.fn<(params: Params) => Response>()

// a plain function, so jest.resetAllMocks() keeps the octokit shape
export const getOctokit = () => ({
  rest: {
    git: { listMatchingRefs },
    repos: { generateReleaseNotes }
  }
})

/** Make listMatchingRefs answer with these tag names, eg ['v1.2.3']. */
export function withTags(tags: string[]): void {
  listMatchingRefs.mockResolvedValue({
    data: tags.map((tag) => ({ ref: `refs/tags/${tag}` }))
  })
}
