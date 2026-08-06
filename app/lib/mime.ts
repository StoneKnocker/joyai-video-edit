export function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    // 图片类型
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    tiff: "image/tiff",
    tif: "image/tiff", // tif 是 tiff 的另一种常见扩展名
    ico: "image/vnd.microsoft.icon", // 或 'image/x-icon'，但 'image/vnd.microsoft.icon' 更标准
    pjpeg: "image/pjpeg", // Progressive JPEG
    avif: "image/avif", // AVIF 格式

    // 视频类型
    mp4: "video/mp4",
    avi: "video/avi",
    mpeg: "video/mpeg",
    mpg: "video/mpeg", // mpg 是 mpeg 的另一种常见扩展名
    webm: "video/webm",
    ogv: "video/ogg", // Ogg Video
    mov: "video/quicktime", // QuickTime 电影
    mkv: "video/x-matroska", // Matroska 容器格式
    "3gp": "video/3gpp", // 3GPP 格式
    "3g2": "video/3gpp2", // 3GPP2 格式
    flv: "video/x-flv", // Flash 视频
    f4v: "video/x-f4v", // Flash 视频 (Adobe Flash Player 9+)
    ts: "video/mp2t", // MPEG Transport Stream (常用于高清电视)

    // 文档类型 (通用文本)
    txt: "text/plain",
    html: "text/html",
    htm: "text/html", // htm 是 html 的另一种常见扩展名
    css: "text/css",
    js: "application/javascript", // 更标准的 JavaScript MIME 类型
    mjs: "application/javascript", // ES Modules JavaScript 文件
    json: "application/json",
    xml: "application/xml",
    csv: "text/csv",
    rtf: "application/rtf", // Rich Text Format

    // 文档类型 (办公文档)
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    odt: "application/vnd.oasis.opendocument.text", // OpenDocument Text
    ods: "application/vnd.oasis.opendocument.spreadsheet", // OpenDocument Spreadsheet
    odp: "application/vnd.oasis.opendocument.presentation", // OpenDocument Presentation

    // 压缩文件类型
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",
    gzip: "application/gzip", // gzip 是 gz 的另一种常见扩展名

    // 3D model types
    glb: "model/gltf-binary",
    gltf: "model/gltf+json",
    fbx: "application/octet-stream",
    obj: "model/obj",
    usdz: "model/vnd.usdz+zip",

    // 音频类型 (虽然请求未明确要求，但音频和视频经常一起考虑，可以根据需要添加)
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg", // Ogg Vorbis
    aac: "audio/aac",
    flac: "audio/flac",
    mid: "audio/midi",
    midi: "audio/midi", // midi 是 mid 的另一种常见扩展名
    opus: "audio/opus",
  };

  return mimeTypes[ext] || "application/octet-stream";
}
