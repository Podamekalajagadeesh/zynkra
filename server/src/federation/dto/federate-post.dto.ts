import { ArrayNotEmpty, IsArray, IsDate, IsOptional, IsString } from 'class-validator';

export class FederatePostDto {
  activityId: string;
  content: string;
  inReplyToId?: string;
  mediaUrls?: string[];
  mentions?: string[];
  tags?: string[];
  publishedAt: Date;
  to?: string[];
  cc?: string[];
}

/**
 * Request body for `POST /federation/posts/federate`.
 *
 * `targetInstances` is part of the DTO rather than a query parameter on
 * purpose: the global `ValidationPipe` runs with `whitelist: true`, which
 * *strips* properties a DTO does not declare. Any undeclared field would be
 * silently deleted before the handler saw it, which is a quiet way to ship an
 * endpoint that ignores its own input.
 */
export class FederatePostRequestDto extends FederatePostDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  targetInstances: string[];

  @IsOptional()
  @IsString()
  localUserId?: string;
}

export class FederateFollowDto {
  objectId: string;
  targetInstance: string;
}

/**
 * Body for the remote-object interaction endpoints (`Like`, `Announce`, and
 * their `Undo`s).
 *
 * There is deliberately **no** target instance or inbox field. The previous
 * `FederateLikeDto` took a `targetInstance` straight from the client, which
 * would have let a caller aim a `Like` at any host the server can reach — the
 * address is instead resolved from the stored remote object, so the request can
 * only ever be delivered to the instance that actually owns the post.
 *
 * `activityId` is a full URL, which is why these are bodies and not path
 * segments: a raw `https://peer.example/users/x/statuses/1` does not survive
 * `:activityId` path matching, and the workarounds (wildcards, manual
 * re-encoding) are a worse trade than one extra JSON field.
 */
export class FederateRemoteObjectDto {
  @IsString()
  activityId: string;
}
