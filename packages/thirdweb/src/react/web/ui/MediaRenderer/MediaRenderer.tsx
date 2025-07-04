"use client";
import type React from "react";
import { forwardRef, useEffect, useRef, useState } from "react";
import {
  CarbonDocumentAudio,
  CarbonDocumentUnknown,
  CarbonPauseFilled,
  CarbonPlayFilledAlt,
} from "./icons.js";
import type { MediaRendererProps } from "./types.js";
import { useResolvedMediaType } from "./useResolvedMediaType.js";

/**
 * Component that renders any asset stored on IPFS (or anywhere else), given the IPFS URI / URL.
 *
 * If an IPFS url is given, the asset is fetched from IPFS through the thirdweb IPFS gateway by default. You can also specify a custom gateway URL using the `gatewayUrl` prop.
 *
 * The [mime type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of the
 * asset is determined and the appropriate component is rendered on the UI.
 *
 * For example, if the URI points to an image, the `img` tag will be used. If it is a video, the `video` tag will be used, etc.
 * The component currently supports:
 *
 * - Images
 * - Videos
 * - Audio files
 * - SVGs (for [on-chain NFTs](https://blog.thirdweb.com/guides/how-to-create-on-chain-nfts-with-thirdweb/))
 * - `iframe` and `HTML`
 * - If none of these are appropriate, the fallback is a link to the asset
 *
 * The default size of rendered media is 300px x 300px, but this can be changed using the `width` and `height` props.
 *
 * You can use thirdweb CLI to upload any file to IPFS and get the IPFS URI
 *
 * Note: This component no longer supports 3D models as of v5.92.0!
 *
 * `npx thirdweb upload <path/to/file>`
 * @example
 * ```tsx
 * import { MediaRenderer } from "thirdweb/react";
 *
 * const client = createThirdwebClient({ clientId: "..." });
 *
 * function Home() {
 * 	return (
 * 		<MediaRenderer client={client} src="ipfs://QmV4HC9fNrPJQeYpbW55NLLuSBMyzE11zS1L4HmL6Lbk7X" />
 * 	);
 * }
 * ```
 * @param props - Refer to [`MediaRendererProps`](https://portal.thirdweb.com/references/typescript/v5/MediaRendererProps) to see the available props.
 */
export const MediaRenderer = /* @__PURE__ */ (() =>
  forwardRef<HTMLMediaElement, MediaRendererProps>(function Media_Renderer(
    {
      src,
      poster,
      alt,
      gatewayUrl,
      requireInteraction = false,
      width = "300px",
      height = "300px",
      style,
      mimeType,
      client,
      controls,
      className,
    },
    ref,
  ) {
    const mergedStyle: React.CSSProperties = {
      objectFit: "contain",
      ...style,
    };

    const { mediaInfo, isFetched: mediaInfoIsFetched } = useResolvedMediaType(
      client,
      src ?? undefined,
      mimeType,
      gatewayUrl,
    );

    const { mediaInfo: possiblePosterSrc } = useResolvedMediaType(
      client,
      poster ?? undefined,
      undefined,
      gatewayUrl,
    );

    if (!mediaInfoIsFetched || !src) {
      return <div style={style} className={className} />;
    }

    if (mediaInfo.mimeType) {
      // html content
      if (mediaInfo.mimeType.startsWith("text/html")) {
        return (
          <IframePlayer
            style={mergedStyle}
            src={mediaInfo.url}
            poster={possiblePosterSrc.url}
            ref={ref as unknown as React.ForwardedRef<HTMLIFrameElement>}
            requireInteraction={requireInteraction}
            className={className}
            alt={alt}
          />
        );
      }

      // 3d model
      if (mediaInfo.mimeType.startsWith("model")) {
        console.error(
          "Encountered an unsupported media type. 3D model support was removed in v5.92.0. To add a 3D model to your app, use @google/model-viewer and use the ModelViewer component.",
        );
      }

      //  video
      if (mediaInfo.mimeType.startsWith("video")) {
        return (
          <VideoPlayer
            style={mergedStyle}
            src={mediaInfo.url}
            ref={ref as unknown as React.ForwardedRef<HTMLVideoElement>}
            poster={
              possiblePosterSrc.mimeType?.startsWith("image/")
                ? possiblePosterSrc.url
                : undefined
            }
            requireInteraction={requireInteraction}
            className={className}
            controls={controls}
          />
        );
      }

      // audio
      if (mediaInfo.mimeType.startsWith("audio")) {
        return (
          <AudioPlayer
            style={mergedStyle}
            src={mediaInfo.url}
            poster={possiblePosterSrc.url}
            alt={alt}
            ref={ref as unknown as React.ForwardedRef<HTMLAudioElement>}
            className={className}
            height={height}
            width={width}
            controls={controls}
          />
        );
      }

      // image
      if (mediaInfo.mimeType.startsWith("image/")) {
        return (
          <ImageRenderer
            style={mergedStyle}
            src={mediaInfo.url}
            alt={alt}
            ref={ref as unknown as React.ForwardedRef<HTMLImageElement>}
            className={className}
            height={height}
            width={width}
          />
        );
      }
    }

    // unknown mime types or no mime type
    return (
      <LinkPlayer
        style={mergedStyle}
        src={mediaInfo.url}
        alt={alt}
        ref={ref as unknown as React.Ref<HTMLAnchorElement>}
        className={className}
      />
    );
  }))();

interface PlayButtonProps {
  onClick: () => void;
  isPlaying: boolean;
}

const PlayButton: React.FC<PlayButtonProps> = ({ onClick, isPlaying }) => {
  const [isHovering, setIsHovering] = useState(false);
  const onMouseEnter = () => setIsHovering(true);
  const onMouseLeave = () => setIsHovering(false);
  const onMouseDown = () => setIsHovering(false);
  const onMouseUp = () => setIsHovering(true);
  return (
    <button
      type="button"
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        transform: "translate(-25%, -25%)",
        width: "32px",
        height: "32px",
        zIndex: 3,
        backgroundColor: "#fff",
        color: "rgb(138, 147, 155)",
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        border: "1px solid rgb(229, 232, 235)",
        cursor: "pointer",
        padding: 0,
        ...(isHovering
          ? {
              color: "rgb(53, 56, 64)",
              boxShadow: "rgb(4 17 29 / 25%) 0px 0px 8px 0px",
            }
          : {}),
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {!isPlaying ? <CarbonPlayFilledAlt /> : <CarbonPauseFilled />}
    </button>
  );
};

const ImageRenderer = /* @__PURE__ */ (() =>
  forwardRef<
    HTMLImageElement,
    Pick<
      MediaRendererProps,
      "src" | "style" | "alt" | "className" | "height" | "width"
    >
  >(function Image_Renderer(props, ref) {
    const { style, src, alt, className, height, width } = props;
    const [error, setError] = useState(false);

    if (error) {
      return (
        <LinkPlayer
          style={style}
          src={src}
          alt={alt}
          ref={ref as unknown as React.Ref<HTMLAnchorElement>}
          className={className}
        />
      );
    }

    return (
      <img
        style={style}
        src={src ?? undefined}
        alt={alt}
        ref={ref}
        className={className}
        height={height}
        width={width}
        onError={() => {
          setError(true);
        }}
      />
    );
  }))();

const VideoPlayer = /* @__PURE__ */ (() =>
  forwardRef<
    HTMLVideoElement,
    Pick<
      MediaRendererProps,
      | "alt"
      | "src"
      | "poster"
      | "requireInteraction"
      | "style"
      | "width"
      | "height"
      | "controls"
      | "className"
    >
  >(function Video_Player(
    {
      src,
      alt,
      poster,
      requireInteraction,
      style,
      width,
      height,
      controls,
      className,
    },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(!requireInteraction);
    const [muted, setMuted] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      if (videoRef.current) {
        if (playing) {
          try {
            videoRef.current.play();
          } catch (err) {
            console.error("Error playing video", err);
          }
        } else {
          try {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          } catch (err) {
            console.error("Error pausing video", err);
          }
        }
      }
    }, [playing]);

    if (error) {
      return (
        <LinkPlayer
          style={style}
          src={src}
          alt={alt}
          ref={ref as unknown as React.Ref<HTMLAnchorElement>}
          className={className}
        />
      );
    }

    return (
      <div style={{ position: "relative", ...style }} className={className}>
        <video
          ref={mergeRefs([videoRef, ref])}
          src={src ?? undefined}
          poster={poster ?? undefined}
          loop
          playsInline
          controlsList="nodownload"
          muted={muted}
          preload={poster ? "metadata" : "auto"}
          onCanPlay={() => {
            if (playing) {
              videoRef.current?.play();
            }
          }}
          onError={() => {
            setError(true);
          }}
          width={width}
          height={height}
          controls={controls}
          style={{
            height: "100%",
            width: "100%",
            objectFit: "contain",
            zIndex: 1,
            transition: "opacity .5s",
            opacity: !poster ? 1 : playing ? 1 : 0,
          }}
        />
        {poster && (
          <img
            src={poster}
            style={{
              objectFit: "contain",
              pointerEvents: "none",
              position: "absolute",
              width: "100%",
              height: "100%",
              zIndex: 2,
              transition: "opacity .5s",
              opacity: playing ? 0 : 1,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            alt={alt}
          />
        )}
        <PlayButton
          onClick={() => {
            setPlaying((prev) => !prev);
            setMuted(false);
          }}
          isPlaying={playing}
        />
      </div>
    );
  }))();

const AudioPlayer = /* @__PURE__ */ (() =>
  forwardRef<
    HTMLAudioElement,
    Pick<
      MediaRendererProps,
      | "src"
      | "alt"
      | "poster"
      | "style"
      | "height"
      | "width"
      | "className"
      | "controls"
    >
  >(function Audio_Player(
    { src, alt, poster, style, height, width, className, controls },
    ref,
  ) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      if (audioRef.current) {
        if (playing) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
    }, [playing]);

    if (error) {
      return (
        <LinkPlayer
          style={style}
          src={src}
          alt={alt}
          ref={ref as unknown as React.Ref<HTMLAnchorElement>}
          className={className}
        />
      );
    }

    return (
      <div style={{ position: "relative", ...style }} className={className}>
        {poster ? (
          <img
            height={height}
            width={width}
            src={poster}
            style={{
              height: "100%",
              width: "100%",
              pointerEvents: "none",
              objectFit: "contain",
            }}
            alt={alt}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
              backgroundColor: "#fff",
              color: "rgb(138, 147, 155)",
            }}
          >
            <CarbonDocumentAudio style={{ height: "64px", width: "64px" }} />
          </div>
        )}

        <PlayButton
          onClick={() => {
            setPlaying((prev) => !prev);
            setMuted(false);
          }}
          isPlaying={playing}
        />
        <audio
          ref={mergeRefs([audioRef, ref])}
          src={src ?? undefined}
          loop
          playsInline
          controls={controls}
          muted={muted}
          preload="none"
          controlsList="nodownload"
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
            visibility: "hidden",
          }}
          onError={() => {
            setError(true);
          }}
        />
      </div>
    );
  }))();

/**
 * @internal Exported for tests
 */
export const IframePlayer = /* @__PURE__ */ (() =>
  forwardRef<
    HTMLIFrameElement,
    Omit<
      MediaRendererProps,
      | "client"
      | "gatewayUrl"
      | "mimeType"
      | "controls"
      | "height"
      | "width"
      | "children"
    >
  >(function Iframe_Player(
    { src, alt, poster, requireInteraction, style, ...restProps },
    ref,
  ) {
    const [playing, setPlaying] = useState(!requireInteraction);

    return (
      <div style={{ position: "relative", ...style }} {...restProps}>
        <iframe
          title={alt || "thirdweb iframe player"}
          src={playing ? (src ?? undefined) : undefined}
          ref={ref}
          style={{
            objectFit: "contain",
            zIndex: 1,
            height: "100%",
            width: "100%",
            transition: "opacity .5s",
            opacity: !poster ? 1 : playing ? 1 : 0,
            border: "none",
          }}
          sandbox="allow-scripts"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        />
        {poster && (
          <img
            src={poster}
            style={{
              objectFit: "contain",
              pointerEvents: "none",
              position: "absolute",
              width: "100%",
              height: "100%",
              zIndex: 2,
              transition: "opacity .5s",
              opacity: playing ? 0 : 1,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            alt={alt}
          />
        )}
        <PlayButton
          onClick={() => {
            setPlaying((prev) => !prev);
          }}
          isPlaying={playing}
        />
      </div>
    );
  }))();

/**
 * @internal Exported for tests
 */
export const LinkPlayer = /* @__PURE__ */ (() =>
  forwardRef<
    HTMLAnchorElement,
    Pick<MediaRendererProps, "src" | "alt" | "style" | "className">
  >(function Link_Player({ src, alt, style, className }, ref) {
    return (
      <div style={{ position: "relative", ...style }} className={className}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center",
            backgroundColor: "#fff",
            color: "rgb(138, 147, 155)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              alignItems: "center",
              flexWrap: "nowrap",
            }}
          >
            <CarbonDocumentUnknown
              style={{
                maxWidth: "128px",
                minWidth: "48px",
                width: "50%",
                aspectRatio: "1",
              }}
            />
            <a
              rel="noopener noreferrer"
              style={{
                textDecoration: "underline",
                color: "rgb(138, 147, 155)",
              }}
              href={src ?? undefined}
              target="_blank"
              ref={ref as unknown as React.LegacyRef<HTMLAnchorElement>}
            >
              {alt || "File"}
            </a>
          </div>
        </div>
      </div>
    );
  }))();

/**
 * @internal
 */
// biome-ignore lint/suspicious/noExplicitAny: TODO: fix any
export function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>,
): React.RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
}
