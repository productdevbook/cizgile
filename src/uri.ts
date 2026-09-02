export {
  type EncodeSet,
  type EncodeSetName,
  isAlpha,
  isDigit,
  isGenDelim,
  isHexDigit,
  isPchar,
  isQueryChar,
  isReserved,
  isScheme,
  isSegmentNzNc,
  isSubDelim,
  isUnreserved,
  resolveEncodeSet,
} from "./uri/charset"
export {
  type EquivalenceLevel,
  equivalentUris,
  type EquivalentUrisOptions,
  isSameDocumentReference,
  type SameDocumentOptions,
} from "./uri/compare"
export {
  encodeForm,
  encodeFragment,
  encodePath,
  type EncodePathOptions,
  encodePathSegment,
  type EncodePathSegmentOptions,
  encodeQuery,
} from "./uri/encode"
export { extractUri } from "./uri/extract"
export {
  type HostKind,
  isHost,
  isIPLiteral,
  isIPv4Address,
  isIPv6Address,
  isIPvFuture,
  isRegName,
  normalizeIPv6Address,
  type ParsedHost,
  parseHost,
} from "./uri/host"
export {
  hasBidiControls,
  iriToUri,
  type IriToUriOptions,
  isBidiControl,
  isIpchar,
  isIprivate,
  isIunreserved,
  isUcschar,
  uriToIri,
} from "./uri/iri"
export {
  type AuthorityComponents,
  DEFAULT_PORTS,
  normalizeUri,
  type NormalizeUriOptions,
  parseAuthority,
  serializeAuthority,
} from "./uri/normalize"
export { parseUri, serializeUri, type UriComponents } from "./uri/parse"
export { normalizePath, type NormalizePathOptions, removeDotSegments } from "./uri/path"
export {
  normalizePercentEncoding,
  percentDecode,
  type PercentDecodeOptions,
  percentEncode,
} from "./uri/percent"
export { domainToAscii, domainToUnicode, punycodeDecode, punycodeEncode } from "./uri/punycode"
export { relativize } from "./uri/relativize"
export { mergePaths, resolveUri, type ResolveUriOptions } from "./uri/resolve"
export {
  classifyReference,
  isAbsoluteUri,
  isIri,
  isIriReference,
  isRelativeReference,
  isUri,
  isUriReference,
  type PathForm,
  pathForm,
  type ReferenceClassification,
  type ValidateOptions,
} from "./uri/validate"
