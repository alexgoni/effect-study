import { Schema } from "effect";

export const RepositoryResponseSchema = Schema.Struct({
  name: Schema.String,
  full_name: Schema.String,
  stargazers_count: Schema.Int,
});

export const decodeRepositoryResponse = Schema.decodeUnknownEffect(
  RepositoryResponseSchema,
);

export type RepositoryResponse = typeof RepositoryResponseSchema.Type;
