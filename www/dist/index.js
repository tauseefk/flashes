var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/sdp/sdp.js
var require_sdp = __commonJS({
  "node_modules/sdp/sdp.js"(exports, module3) {
    "use strict";
    var SDPUtils2 = {};
    SDPUtils2.generateIdentifier = function() {
      return Math.random().toString(36).substring(2, 12);
    };
    SDPUtils2.localCName = SDPUtils2.generateIdentifier();
    SDPUtils2.splitLines = function(blob) {
      return blob.trim().split("\n").map((line) => line.trim());
    };
    SDPUtils2.splitSections = function(blob) {
      const parts = blob.split("\nm=");
      return parts.map((part, index) => (index > 0 ? "m=" + part : part).trim() + "\r\n");
    };
    SDPUtils2.getDescription = function(blob) {
      const sections = SDPUtils2.splitSections(blob);
      return sections && sections[0];
    };
    SDPUtils2.getMediaSections = function(blob) {
      const sections = SDPUtils2.splitSections(blob);
      sections.shift();
      return sections;
    };
    SDPUtils2.matchPrefix = function(blob, prefix) {
      return SDPUtils2.splitLines(blob).filter((line) => line.indexOf(prefix) === 0);
    };
    SDPUtils2.parseCandidate = function(line) {
      let parts;
      if (line.indexOf("a=candidate:") === 0) {
        parts = line.substring(12).split(" ");
      } else {
        parts = line.substring(10).split(" ");
      }
      const candidate = {
        foundation: parts[0],
        component: { 1: "rtp", 2: "rtcp" }[parts[1]] || parts[1],
        protocol: parts[2].toLowerCase(),
        priority: parseInt(parts[3], 10),
        ip: parts[4],
        address: parts[4],
        // address is an alias for ip.
        port: parseInt(parts[5], 10),
        // skip parts[6] == 'typ'
        type: parts[7]
      };
      for (let i2 = 8; i2 < parts.length; i2 += 2) {
        switch (parts[i2]) {
          case "raddr":
            candidate.relatedAddress = parts[i2 + 1];
            break;
          case "rport":
            candidate.relatedPort = parseInt(parts[i2 + 1], 10);
            break;
          case "tcptype":
            candidate.tcpType = parts[i2 + 1];
            break;
          case "ufrag":
            candidate.ufrag = parts[i2 + 1];
            candidate.usernameFragment = parts[i2 + 1];
            break;
          default:
            if (candidate[parts[i2]] === void 0) {
              candidate[parts[i2]] = parts[i2 + 1];
            }
            break;
        }
      }
      return candidate;
    };
    SDPUtils2.writeCandidate = function(candidate) {
      const sdp2 = [];
      sdp2.push(candidate.foundation);
      const component = candidate.component;
      if (component === "rtp") {
        sdp2.push(1);
      } else if (component === "rtcp") {
        sdp2.push(2);
      } else {
        sdp2.push(component);
      }
      sdp2.push(candidate.protocol.toUpperCase());
      sdp2.push(candidate.priority);
      sdp2.push(candidate.address || candidate.ip);
      sdp2.push(candidate.port);
      const type = candidate.type;
      sdp2.push("typ");
      sdp2.push(type);
      if (type !== "host" && candidate.relatedAddress && candidate.relatedPort) {
        sdp2.push("raddr");
        sdp2.push(candidate.relatedAddress);
        sdp2.push("rport");
        sdp2.push(candidate.relatedPort);
      }
      if (candidate.tcpType && candidate.protocol.toLowerCase() === "tcp") {
        sdp2.push("tcptype");
        sdp2.push(candidate.tcpType);
      }
      if (candidate.usernameFragment || candidate.ufrag) {
        sdp2.push("ufrag");
        sdp2.push(candidate.usernameFragment || candidate.ufrag);
      }
      return "candidate:" + sdp2.join(" ");
    };
    SDPUtils2.parseIceOptions = function(line) {
      return line.substring(14).split(" ");
    };
    SDPUtils2.parseRtpMap = function(line) {
      let parts = line.substring(9).split(" ");
      const parsed = {
        payloadType: parseInt(parts.shift(), 10)
        // was: id
      };
      parts = parts[0].split("/");
      parsed.name = parts[0];
      parsed.clockRate = parseInt(parts[1], 10);
      parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
      parsed.numChannels = parsed.channels;
      return parsed;
    };
    SDPUtils2.writeRtpMap = function(codec) {
      let pt = codec.payloadType;
      if (codec.preferredPayloadType !== void 0) {
        pt = codec.preferredPayloadType;
      }
      const channels = codec.channels || codec.numChannels || 1;
      return "a=rtpmap:" + pt + " " + codec.name + "/" + codec.clockRate + (channels !== 1 ? "/" + channels : "") + "\r\n";
    };
    SDPUtils2.parseExtmap = function(line) {
      const parts = line.substring(9).split(" ");
      return {
        id: parseInt(parts[0], 10),
        direction: parts[0].indexOf("/") > 0 ? parts[0].split("/")[1] : "sendrecv",
        uri: parts[1],
        attributes: parts.slice(2).join(" ")
      };
    };
    SDPUtils2.writeExtmap = function(headerExtension) {
      return "a=extmap:" + (headerExtension.id || headerExtension.preferredId) + (headerExtension.direction && headerExtension.direction !== "sendrecv" ? "/" + headerExtension.direction : "") + " " + headerExtension.uri + (headerExtension.attributes ? " " + headerExtension.attributes : "") + "\r\n";
    };
    SDPUtils2.parseFmtp = function(line) {
      const parsed = {};
      let kv;
      const parts = line.substring(line.indexOf(" ") + 1).split(";");
      for (let j = 0; j < parts.length; j++) {
        kv = parts[j].trim().split("=");
        parsed[kv[0].trim()] = kv[1];
      }
      return parsed;
    };
    SDPUtils2.writeFmtp = function(codec) {
      let line = "";
      let pt = codec.payloadType;
      if (codec.preferredPayloadType !== void 0) {
        pt = codec.preferredPayloadType;
      }
      if (codec.parameters && Object.keys(codec.parameters).length) {
        const params = [];
        Object.keys(codec.parameters).forEach((param) => {
          if (codec.parameters[param] !== void 0) {
            params.push(param + "=" + codec.parameters[param]);
          } else {
            params.push(param);
          }
        });
        line += "a=fmtp:" + pt + " " + params.join(";") + "\r\n";
      }
      return line;
    };
    SDPUtils2.parseRtcpFb = function(line) {
      const parts = line.substring(line.indexOf(" ") + 1).split(" ");
      return {
        type: parts.shift(),
        parameter: parts.join(" ")
      };
    };
    SDPUtils2.writeRtcpFb = function(codec) {
      let lines = "";
      let pt = codec.payloadType;
      if (codec.preferredPayloadType !== void 0) {
        pt = codec.preferredPayloadType;
      }
      if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
        codec.rtcpFeedback.forEach((fb) => {
          lines += "a=rtcp-fb:" + pt + " " + fb.type + (fb.parameter && fb.parameter.length ? " " + fb.parameter : "") + "\r\n";
        });
      }
      return lines;
    };
    SDPUtils2.parseSsrcMedia = function(line) {
      const sp = line.indexOf(" ");
      const parts = {
        ssrc: parseInt(line.substring(7, sp), 10)
      };
      const colon = line.indexOf(":", sp);
      if (colon > -1) {
        parts.attribute = line.substring(sp + 1, colon);
        parts.value = line.substring(colon + 1);
      } else {
        parts.attribute = line.substring(sp + 1);
      }
      return parts;
    };
    SDPUtils2.parseSsrcGroup = function(line) {
      const parts = line.substring(13).split(" ");
      return {
        semantics: parts.shift(),
        ssrcs: parts.map((ssrc) => parseInt(ssrc, 10))
      };
    };
    SDPUtils2.getMid = function(mediaSection) {
      const mid = SDPUtils2.matchPrefix(mediaSection, "a=mid:")[0];
      if (mid) {
        return mid.substring(6);
      }
    };
    SDPUtils2.parseFingerprint = function(line) {
      const parts = line.substring(14).split(" ");
      return {
        algorithm: parts[0].toLowerCase(),
        // algorithm is case-sensitive in Edge.
        value: parts[1].toUpperCase()
        // the definition is upper-case in RFC 4572.
      };
    };
    SDPUtils2.getDtlsParameters = function(mediaSection, sessionpart) {
      const lines = SDPUtils2.matchPrefix(
        mediaSection + sessionpart,
        "a=fingerprint:"
      );
      return {
        role: "auto",
        fingerprints: lines.map(SDPUtils2.parseFingerprint)
      };
    };
    SDPUtils2.writeDtlsParameters = function(params, setupType) {
      let sdp2 = "a=setup:" + setupType + "\r\n";
      params.fingerprints.forEach((fp) => {
        sdp2 += "a=fingerprint:" + fp.algorithm + " " + fp.value + "\r\n";
      });
      return sdp2;
    };
    SDPUtils2.parseCryptoLine = function(line) {
      const parts = line.substring(9).split(" ");
      return {
        tag: parseInt(parts[0], 10),
        cryptoSuite: parts[1],
        keyParams: parts[2],
        sessionParams: parts.slice(3)
      };
    };
    SDPUtils2.writeCryptoLine = function(parameters) {
      return "a=crypto:" + parameters.tag + " " + parameters.cryptoSuite + " " + (typeof parameters.keyParams === "object" ? SDPUtils2.writeCryptoKeyParams(parameters.keyParams) : parameters.keyParams) + (parameters.sessionParams ? " " + parameters.sessionParams.join(" ") : "") + "\r\n";
    };
    SDPUtils2.parseCryptoKeyParams = function(keyParams) {
      if (keyParams.indexOf("inline:") !== 0) {
        return null;
      }
      const parts = keyParams.substring(7).split("|");
      return {
        keyMethod: "inline",
        keySalt: parts[0],
        lifeTime: parts[1],
        mkiValue: parts[2] ? parts[2].split(":")[0] : void 0,
        mkiLength: parts[2] ? parts[2].split(":")[1] : void 0
      };
    };
    SDPUtils2.writeCryptoKeyParams = function(keyParams) {
      return keyParams.keyMethod + ":" + keyParams.keySalt + (keyParams.lifeTime ? "|" + keyParams.lifeTime : "") + (keyParams.mkiValue && keyParams.mkiLength ? "|" + keyParams.mkiValue + ":" + keyParams.mkiLength : "");
    };
    SDPUtils2.getCryptoParameters = function(mediaSection, sessionpart) {
      const lines = SDPUtils2.matchPrefix(
        mediaSection + sessionpart,
        "a=crypto:"
      );
      return lines.map(SDPUtils2.parseCryptoLine);
    };
    SDPUtils2.getIceParameters = function(mediaSection, sessionpart) {
      const ufrag = SDPUtils2.matchPrefix(
        mediaSection + sessionpart,
        "a=ice-ufrag:"
      )[0];
      const pwd = SDPUtils2.matchPrefix(
        mediaSection + sessionpart,
        "a=ice-pwd:"
      )[0];
      if (!(ufrag && pwd)) {
        return null;
      }
      return {
        usernameFragment: ufrag.substring(12),
        password: pwd.substring(10)
      };
    };
    SDPUtils2.writeIceParameters = function(params) {
      let sdp2 = "a=ice-ufrag:" + params.usernameFragment + "\r\na=ice-pwd:" + params.password + "\r\n";
      if (params.iceLite) {
        sdp2 += "a=ice-lite\r\n";
      }
      return sdp2;
    };
    SDPUtils2.parseRtpParameters = function(mediaSection) {
      const description = {
        codecs: [],
        headerExtensions: [],
        fecMechanisms: [],
        rtcp: []
      };
      const lines = SDPUtils2.splitLines(mediaSection);
      const mline = lines[0].split(" ");
      description.profile = mline[2];
      for (let i2 = 3; i2 < mline.length; i2++) {
        const pt = mline[i2];
        const rtpmapline = SDPUtils2.matchPrefix(
          mediaSection,
          "a=rtpmap:" + pt + " "
        )[0];
        if (rtpmapline) {
          const codec = SDPUtils2.parseRtpMap(rtpmapline);
          const fmtps = SDPUtils2.matchPrefix(
            mediaSection,
            "a=fmtp:" + pt + " "
          );
          codec.parameters = fmtps.length ? SDPUtils2.parseFmtp(fmtps[0]) : {};
          codec.rtcpFeedback = SDPUtils2.matchPrefix(
            mediaSection,
            "a=rtcp-fb:" + pt + " "
          ).map(SDPUtils2.parseRtcpFb);
          description.codecs.push(codec);
          switch (codec.name.toUpperCase()) {
            case "RED":
            case "ULPFEC":
              description.fecMechanisms.push(codec.name.toUpperCase());
              break;
            default:
              break;
          }
        }
      }
      SDPUtils2.matchPrefix(mediaSection, "a=extmap:").forEach((line) => {
        description.headerExtensions.push(SDPUtils2.parseExtmap(line));
      });
      const wildcardRtcpFb = SDPUtils2.matchPrefix(mediaSection, "a=rtcp-fb:* ").map(SDPUtils2.parseRtcpFb);
      description.codecs.forEach((codec) => {
        wildcardRtcpFb.forEach((fb) => {
          const duplicate = codec.rtcpFeedback.find((existingFeedback) => {
            return existingFeedback.type === fb.type && existingFeedback.parameter === fb.parameter;
          });
          if (!duplicate) {
            codec.rtcpFeedback.push(fb);
          }
        });
      });
      return description;
    };
    SDPUtils2.writeRtpDescription = function(kind, caps) {
      let sdp2 = "";
      sdp2 += "m=" + kind + " ";
      sdp2 += caps.codecs.length > 0 ? "9" : "0";
      sdp2 += " " + (caps.profile || "UDP/TLS/RTP/SAVPF") + " ";
      sdp2 += caps.codecs.map((codec) => {
        if (codec.preferredPayloadType !== void 0) {
          return codec.preferredPayloadType;
        }
        return codec.payloadType;
      }).join(" ") + "\r\n";
      sdp2 += "c=IN IP4 0.0.0.0\r\n";
      sdp2 += "a=rtcp:9 IN IP4 0.0.0.0\r\n";
      caps.codecs.forEach((codec) => {
        sdp2 += SDPUtils2.writeRtpMap(codec);
        sdp2 += SDPUtils2.writeFmtp(codec);
        sdp2 += SDPUtils2.writeRtcpFb(codec);
      });
      let maxptime = 0;
      caps.codecs.forEach((codec) => {
        if (codec.maxptime > maxptime) {
          maxptime = codec.maxptime;
        }
      });
      if (maxptime > 0) {
        sdp2 += "a=maxptime:" + maxptime + "\r\n";
      }
      if (caps.headerExtensions) {
        caps.headerExtensions.forEach((extension) => {
          sdp2 += SDPUtils2.writeExtmap(extension);
        });
      }
      return sdp2;
    };
    SDPUtils2.parseRtpEncodingParameters = function(mediaSection) {
      const encodingParameters = [];
      const description = SDPUtils2.parseRtpParameters(mediaSection);
      const hasRed = description.fecMechanisms.indexOf("RED") !== -1;
      const hasUlpfec = description.fecMechanisms.indexOf("ULPFEC") !== -1;
      const ssrcs = SDPUtils2.matchPrefix(mediaSection, "a=ssrc:").map((line) => SDPUtils2.parseSsrcMedia(line)).filter((parts) => parts.attribute === "cname");
      const primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
      let secondarySsrc;
      const flows = SDPUtils2.matchPrefix(mediaSection, "a=ssrc-group:FID").map((line) => {
        const parts = line.substring(17).split(" ");
        return parts.map((part) => parseInt(part, 10));
      });
      if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
        secondarySsrc = flows[0][1];
      }
      description.codecs.forEach((codec) => {
        if (codec.name.toUpperCase() === "RTX" && codec.parameters.apt) {
          let encParam = {
            ssrc: primarySsrc,
            codecPayloadType: parseInt(codec.parameters.apt, 10)
          };
          if (primarySsrc && secondarySsrc) {
            encParam.rtx = { ssrc: secondarySsrc };
          }
          encodingParameters.push(encParam);
          if (hasRed) {
            encParam = JSON.parse(JSON.stringify(encParam));
            encParam.fec = {
              ssrc: primarySsrc,
              mechanism: hasUlpfec ? "red+ulpfec" : "red"
            };
            encodingParameters.push(encParam);
          }
        }
      });
      if (encodingParameters.length === 0 && primarySsrc) {
        encodingParameters.push({
          ssrc: primarySsrc
        });
      }
      let bandwidth = SDPUtils2.matchPrefix(mediaSection, "b=");
      if (bandwidth.length) {
        if (bandwidth[0].indexOf("b=TIAS:") === 0) {
          bandwidth = parseInt(bandwidth[0].substring(7), 10);
        } else if (bandwidth[0].indexOf("b=AS:") === 0) {
          bandwidth = parseInt(bandwidth[0].substring(5), 10) * 1e3 * 0.95 - 50 * 40 * 8;
        } else {
          bandwidth = void 0;
        }
        encodingParameters.forEach((params) => {
          params.maxBitrate = bandwidth;
        });
      }
      return encodingParameters;
    };
    SDPUtils2.parseRtcpParameters = function(mediaSection) {
      const rtcpParameters = {};
      const remoteSsrc = SDPUtils2.matchPrefix(mediaSection, "a=ssrc:").map((line) => SDPUtils2.parseSsrcMedia(line)).filter((obj) => obj.attribute === "cname")[0];
      if (remoteSsrc) {
        rtcpParameters.cname = remoteSsrc.value;
        rtcpParameters.ssrc = remoteSsrc.ssrc;
      }
      const rsize = SDPUtils2.matchPrefix(mediaSection, "a=rtcp-rsize");
      rtcpParameters.reducedSize = rsize.length > 0;
      rtcpParameters.compound = rsize.length === 0;
      const mux = SDPUtils2.matchPrefix(mediaSection, "a=rtcp-mux");
      rtcpParameters.mux = mux.length > 0;
      return rtcpParameters;
    };
    SDPUtils2.writeRtcpParameters = function(rtcpParameters) {
      let sdp2 = "";
      if (rtcpParameters.reducedSize) {
        sdp2 += "a=rtcp-rsize\r\n";
      }
      if (rtcpParameters.mux) {
        sdp2 += "a=rtcp-mux\r\n";
      }
      if (rtcpParameters.ssrc !== void 0 && rtcpParameters.cname) {
        sdp2 += "a=ssrc:" + rtcpParameters.ssrc + " cname:" + rtcpParameters.cname + "\r\n";
      }
      return sdp2;
    };
    SDPUtils2.parseMsid = function(mediaSection) {
      let parts;
      const spec = SDPUtils2.matchPrefix(mediaSection, "a=msid:");
      if (spec.length === 1) {
        parts = spec[0].substring(7).split(" ");
        return { stream: parts[0], track: parts[1] };
      }
      const planB = SDPUtils2.matchPrefix(mediaSection, "a=ssrc:").map((line) => SDPUtils2.parseSsrcMedia(line)).filter((msidParts) => msidParts.attribute === "msid");
      if (planB.length > 0) {
        parts = planB[0].value.split(" ");
        return { stream: parts[0], track: parts[1] };
      }
    };
    SDPUtils2.parseSctpDescription = function(mediaSection) {
      const mline = SDPUtils2.parseMLine(mediaSection);
      const maxSizeLine = SDPUtils2.matchPrefix(mediaSection, "a=max-message-size:");
      let maxMessageSize;
      if (maxSizeLine.length > 0) {
        maxMessageSize = parseInt(maxSizeLine[0].substring(19), 10);
      }
      if (isNaN(maxMessageSize)) {
        maxMessageSize = 65536;
      }
      const sctpPort = SDPUtils2.matchPrefix(mediaSection, "a=sctp-port:");
      if (sctpPort.length > 0) {
        return {
          port: parseInt(sctpPort[0].substring(12), 10),
          protocol: mline.fmt,
          maxMessageSize
        };
      }
      const sctpMapLines = SDPUtils2.matchPrefix(mediaSection, "a=sctpmap:");
      if (sctpMapLines.length > 0) {
        const parts = sctpMapLines[0].substring(10).split(" ");
        return {
          port: parseInt(parts[0], 10),
          protocol: parts[1],
          maxMessageSize
        };
      }
    };
    SDPUtils2.writeSctpDescription = function(media, sctp) {
      let output = [];
      if (media.protocol !== "DTLS/SCTP") {
        output = [
          "m=" + media.kind + " 9 " + media.protocol + " " + sctp.protocol + "\r\n",
          "c=IN IP4 0.0.0.0\r\n",
          "a=sctp-port:" + sctp.port + "\r\n"
        ];
      } else {
        output = [
          "m=" + media.kind + " 9 " + media.protocol + " " + sctp.port + "\r\n",
          "c=IN IP4 0.0.0.0\r\n",
          "a=sctpmap:" + sctp.port + " " + sctp.protocol + " 65535\r\n"
        ];
      }
      if (sctp.maxMessageSize !== void 0) {
        output.push("a=max-message-size:" + sctp.maxMessageSize + "\r\n");
      }
      return output.join("");
    };
    SDPUtils2.generateSessionId = function() {
      return Math.random().toString().substr(2, 22);
    };
    SDPUtils2.writeSessionBoilerplate = function(sessId, sessVer, sessUser) {
      let sessionId;
      const version = sessVer !== void 0 ? sessVer : 2;
      if (sessId) {
        sessionId = sessId;
      } else {
        sessionId = SDPUtils2.generateSessionId();
      }
      const user = sessUser || "thisisadapterortc";
      return "v=0\r\no=" + user + " " + sessionId + " " + version + " IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";
    };
    SDPUtils2.getDirection = function(mediaSection, sessionpart) {
      const lines = SDPUtils2.splitLines(mediaSection);
      for (let i2 = 0; i2 < lines.length; i2++) {
        switch (lines[i2]) {
          case "a=sendrecv":
          case "a=sendonly":
          case "a=recvonly":
          case "a=inactive":
            return lines[i2].substring(2);
          default:
        }
      }
      if (sessionpart) {
        return SDPUtils2.getDirection(sessionpart);
      }
      return "sendrecv";
    };
    SDPUtils2.getKind = function(mediaSection) {
      const lines = SDPUtils2.splitLines(mediaSection);
      const mline = lines[0].split(" ");
      return mline[0].substring(2);
    };
    SDPUtils2.isRejected = function(mediaSection) {
      return mediaSection.split(" ", 2)[1] === "0";
    };
    SDPUtils2.parseMLine = function(mediaSection) {
      const lines = SDPUtils2.splitLines(mediaSection);
      const parts = lines[0].substring(2).split(" ");
      return {
        kind: parts[0],
        port: parseInt(parts[1], 10),
        protocol: parts[2],
        fmt: parts.slice(3).join(" ")
      };
    };
    SDPUtils2.parseOLine = function(mediaSection) {
      const line = SDPUtils2.matchPrefix(mediaSection, "o=")[0];
      const parts = line.substring(2).split(" ");
      return {
        username: parts[0],
        sessionId: parts[1],
        sessionVersion: parseInt(parts[2], 10),
        netType: parts[3],
        addressType: parts[4],
        address: parts[5]
      };
    };
    SDPUtils2.isValidSDP = function(blob) {
      if (typeof blob !== "string" || blob.length === 0) {
        return false;
      }
      const lines = SDPUtils2.splitLines(blob);
      for (let i2 = 0; i2 < lines.length; i2++) {
        if (lines[i2].length < 2 || lines[i2].charAt(1) !== "=") {
          return false;
        }
      }
      return true;
    };
    if (typeof module3 === "object") {
      module3.exports = SDPUtils2;
    }
  }
});

// node_modules/rextream/dist/index.js
var i = class u {
  subscribe;
  unsubscribe;
  constructor(e, t) {
    this.subscribe = e, this.unsubscribe = t;
  }
  compose(e) {
    return e(this);
  }
  map(e) {
    return this.compose(o(e));
  }
  switchMap(e) {
    return this.compose(d(e));
  }
  filter(e) {
    return this.compose(b(e));
  }
  debounceTime(e) {
    return this.compose(l(e));
  }
  withLatestFrom(e) {
    return this.compose(T(e));
  }
  static fromEvent(e, t) {
    let r = new u((n) => (t.addEventListener(e, n.next), r.unsubscribe = () => {
      n.complete(), t.removeEventListener(e, n.next);
    }, r.unsubscribe));
    return r;
  }
  static fromTimer(e) {
    let t = new u((r) => {
      let n = 0, s = setTimeout(() => {
        n += 1, r.next(n);
      }, e);
      return t.unsubscribe = () => {
        r.complete(), clearTimeout(s);
      }, t.unsubscribe;
    });
    return t;
  }
  static fromReadableStream(e) {
    let t = new u((r) => {
      let n = async () => {
        let s = e.getReader(), c = await s.read();
        s.releaseLock(), c.done ? r.complete() : r.next({ value: c.value, done: c.done });
      };
      return t.unsubscribe = () => {
        r.complete();
      }, n(), t.unsubscribe;
    });
    return t;
  }
  static eagerFromReadableStream(e) {
    let t = new u((r) => {
      let n = async () => {
        let s = e.getReader(), c = await s.read();
        s.releaseLock(), c.done ? r.complete() : (r.next({ value: c.value, done: c.done }), await n());
      };
      return t.unsubscribe = () => {
        r.complete();
      }, n(), t.unsubscribe;
    });
    return t;
  }
  static fromInterval(e) {
    let t = new u((r) => {
      let n = 0, s = setInterval(() => {
        n += 1, r.next(n);
      }, e);
      return t.unsubscribe = () => {
        r.complete(), clearInterval(s);
      }, t.unsubscribe;
    });
    return t;
  }
};
function o(u2) {
  return (e) => {
    let t = new i((r) => (e.subscribe({ next: (n) => r.next(u2(n)), complete: r.complete }), t.unsubscribe = () => {
      typeof e.unsubscribe == "function" && e.unsubscribe();
    }, t.unsubscribe));
    return t;
  };
}
var m = () => {
};
function b(u2) {
  return (e) => {
    let t = new i((r) => (e.subscribe({ next: (n) => u2(n) ? r.next(n) : m(), complete: r.complete }), t.unsubscribe = () => {
      typeof e.unsubscribe == "function" && e.unsubscribe();
    }, t.unsubscribe));
    return t;
  };
}
function l(u2) {
  let e = null;
  return (t) => {
    let r = new i((n) => (t.subscribe({ next: (s) => {
      e && (clearTimeout(e), e = null), e = window.setTimeout(() => n.next(s), u2);
    }, complete: () => {
      e && window.clearTimeout(e), n.complete();
    } }), r.unsubscribe = () => {
      e && window.clearTimeout(e), typeof t.unsubscribe == "function" && t.unsubscribe();
    }, r.unsubscribe));
    return r;
  };
}
function T(u2) {
  let e, t, r = false;
  return (n) => {
    let s = new i((c) => (u2.subscribe({ next: (a) => {
      e = a, c.next([e, t]);
    }, complete: () => {
      if (!r) {
        r = true;
        return;
      }
      c.complete();
    } }), n.subscribe({ next: (a) => {
      t = a, c.next([e, t]);
    }, complete: () => {
      if (!r) {
        r = true;
        return;
      }
      c.complete();
    } }), s.unsubscribe = () => {
      typeof n.unsubscribe == "function" && n.unsubscribe(), typeof u2.unsubscribe == "function" && u2.unsubscribe();
    }, s.unsubscribe));
    return s;
  };
}
function d(u2) {
  let e = null;
  return (t) => {
    let r = new i((n) => (t.subscribe({ next: (s) => {
      e?.unsubscribe?.(), e = u2(s), e.subscribe(n);
    }, complete: () => n.complete() }), r.unsubscribe = () => {
      e?.unsubscribe?.(), t?.unsubscribe?.(), n.complete();
    }, r.unsubscribe));
    return r;
  };
}

// wasm-module:/Users/tauseefk/personal/rust/flashes/www/engine/flashlight_bg.wasm
var flashlight_bg_exports = {};
__export(flashlight_bg_exports, {
  __externref_drop_slice: () => __externref_drop_slice,
  __externref_table_alloc: () => __externref_table_alloc,
  __wbg_flashlight_free: () => __wbg_flashlight_free,
  __wbg_get_flashlight_monster_poise: () => __wbg_get_flashlight_monster_poise,
  __wbg_get_flashlight_player_poise: () => __wbg_get_flashlight_player_poise,
  __wbg_get_flashlight_view_width: () => __wbg_get_flashlight_view_width,
  __wbg_get_flashlight_width: () => __wbg_get_flashlight_width,
  __wbg_get_mapmetadata_player_cell_idx: () => __wbg_get_mapmetadata_player_cell_idx,
  __wbg_get_mapmetadata_target_cell_idx: () => __wbg_get_mapmetadata_target_cell_idx,
  __wbg_get_mapmetadata_width: () => __wbg_get_mapmetadata_width,
  __wbg_get_move_from: () => __wbg_get_move_from,
  __wbg_get_move_to: () => __wbg_get_move_to,
  __wbg_get_vec2_0: () => __wbg_get_vec2_0,
  __wbg_get_vec2_1: () => __wbg_get_vec2_1,
  __wbg_mapmetadata_free: () => __wbg_mapmetadata_free,
  __wbg_move_free: () => __wbg_move_free,
  __wbg_set_flashlight_monster_poise: () => __wbg_set_flashlight_monster_poise,
  __wbg_set_flashlight_player_poise: () => __wbg_set_flashlight_player_poise,
  __wbg_set_flashlight_view_width: () => __wbg_set_flashlight_view_width,
  __wbg_set_flashlight_width: () => __wbg_set_flashlight_width,
  __wbg_set_mapmetadata_player_cell_idx: () => __wbg_set_mapmetadata_player_cell_idx,
  __wbg_set_mapmetadata_target_cell_idx: () => __wbg_set_mapmetadata_target_cell_idx,
  __wbg_set_mapmetadata_width: () => __wbg_set_mapmetadata_width,
  __wbg_set_move_from: () => __wbg_set_move_from,
  __wbg_set_move_to: () => __wbg_set_move_to,
  __wbg_set_vec2_0: () => __wbg_set_vec2_0,
  __wbg_set_vec2_1: () => __wbg_set_vec2_1,
  __wbg_vec2_free: () => __wbg_vec2_free,
  __wbindgen_exn_store: () => __wbindgen_exn_store,
  __wbindgen_export_2: () => __wbindgen_export_2,
  __wbindgen_free: () => __wbindgen_free,
  __wbindgen_malloc: () => __wbindgen_malloc,
  __wbindgen_start: () => __wbindgen_start,
  flashlight_apply_delta_js: () => flashlight_apply_delta_js,
  flashlight_apply_initial_state_vector_js: () => flashlight_apply_initial_state_vector_js,
  flashlight_compute_visibility: () => flashlight_compute_visibility,
  flashlight_do_move_enemy: () => flashlight_do_move_enemy,
  flashlight_do_move_player: () => flashlight_do_move_player,
  flashlight_get_clipped_map_state: () => flashlight_get_clipped_map_state,
  flashlight_is_solvable: () => flashlight_is_solvable,
  flashlight_map_metadata: () => flashlight_map_metadata,
  flashlight_new: () => flashlight_new,
  flashlight_new_from_js: () => flashlight_new_from_js,
  flashlight_visibility_state: () => flashlight_visibility_state,
  instance: () => instance,
  memory: () => memory,
  module: () => module2,
  move_new: () => move_new,
  move_new_with_data: () => move_new_with_data,
  vec2_new: () => vec2_new,
  vec2_new_with_data: () => vec2_new_with_data
});

// wasm-deferred:/Users/tauseefk/personal/rust/flashes/www/engine/flashlight_bg.wasm
var flashlight_bg_default = "./flashlight_bg-LBBSXTLU.wasm";

// engine/flashlight_bg.js
var wasm;
function __wbg_set_wasm(val) {
  wasm = val;
}
function addToExternrefTable0(obj) {
  const idx = wasm.__externref_table_alloc();
  wasm.__wbindgen_export_2.set(idx, obj);
  return idx;
}
function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    const idx = addToExternrefTable0(e);
    wasm.__wbindgen_exn_store(idx);
  }
}
var lTextDecoder = typeof TextDecoder === "undefined" ? (0, module.require)("util").TextDecoder : TextDecoder;
var cachedTextDecoder = new lTextDecoder("utf-8", { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
var cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}
function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
function isLikeNone(x) {
  return x === void 0 || x === null;
}
var cachedDataViewMemory0 = null;
function getDataViewMemory0() {
  if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  }
  return cachedDataViewMemory0;
}
var WASM_VECTOR_LEN = 0;
function passArrayJsValueToWasm0(array, malloc) {
  const ptr = malloc(array.length * 4, 4) >>> 0;
  for (let i2 = 0; i2 < array.length; i2++) {
    const add = addToExternrefTable0(array[i2]);
    getDataViewMemory0().setUint32(ptr + 4 * i2, add, true);
  }
  WASM_VECTOR_LEN = array.length;
  return ptr;
}
function getArrayJsValueFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  const mem = getDataViewMemory0();
  const result = [];
  for (let i2 = ptr; i2 < ptr + 4 * len; i2 += 4) {
    result.push(wasm.__wbindgen_export_2.get(mem.getUint32(i2, true)));
  }
  wasm.__externref_drop_slice(ptr, len);
  return result;
}
function _assertClass(instance2, klass) {
  if (!(instance2 instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }
}
var Glyph = Object.freeze({
  Target: 0,
  "0": "Target",
  Water: 1,
  "1": "Water",
  Tree: 2,
  "2": "Tree",
  Rock: 3,
  "3": "Rock",
  Floor: 4,
  "4": "Floor",
  Player: 5,
  "5": "Player",
  Monster: 6,
  "6": "Monster",
  DefeatedMonster: 7,
  "7": "DefeatedMonster"
});
var MoveOutcome = Object.freeze({
  NoOp: 0,
  "0": "NoOp",
  Rejected: 1,
  "1": "Rejected",
  Advance: 2,
  "2": "Advance",
  End: 3,
  "3": "End"
});
var FlashlightFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_flashlight_free(ptr >>> 0, 1));
var Flashlight = class _Flashlight {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(_Flashlight.prototype);
    obj.__wbg_ptr = ptr;
    FlashlightFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    FlashlightFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_flashlight_free(ptr, 0);
  }
  /**
   * @returns {number}
   */
  get width() {
    const ret = wasm.__wbg_get_flashlight_width(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set width(arg0) {
    wasm.__wbg_set_flashlight_width(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get view_width() {
    const ret = wasm.__wbg_get_flashlight_view_width(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set view_width(arg0) {
    wasm.__wbg_set_flashlight_view_width(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get player_poise() {
    const ret = wasm.__wbg_get_flashlight_player_poise(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set player_poise(arg0) {
    wasm.__wbg_set_flashlight_player_poise(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get monster_poise() {
    const ret = wasm.__wbg_get_flashlight_monster_poise(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set monster_poise(arg0) {
    wasm.__wbg_set_flashlight_monster_poise(this.__wbg_ptr, arg0);
  }
  /**
   * @param {any[]} level
   * @param {number} width
   * @param {number} cell_width
   * @param {number} view_width
   * @returns {Flashlight}
   */
  static new(level, width, cell_width, view_width) {
    const ptr0 = passArrayJsValueToWasm0(level, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.flashlight_new(ptr0, len0, width, cell_width, view_width);
    return _Flashlight.__wrap(ret);
  }
  /**
   * This function creates a new `Flashlight` instance from a JavaScript `Uint8Array`.
   *
   * It converts the `Uint8Array` into a vector of `Glyph` and initializes the `Flashlight` instance
   * with the given level and width.
   * @param {Uint8Array} level
   * @param {number} width
   * @param {number} cell_width
   * @param {number} view_width
   * @returns {Flashlight}
   */
  static new_from_js(level, width, cell_width, view_width) {
    const ret = wasm.flashlight_new_from_js(level, width, cell_width, view_width);
    return _Flashlight.__wrap(ret);
  }
  /**
   * This function returns the current state of the map (after applying visibility mask and camera clipping) as a Vector of `Glyph`s.
   * @returns {any[]}
   */
  get_clipped_map_state() {
    const ret = wasm.flashlight_get_clipped_map_state(this.__wbg_ptr);
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
  /**
   * This function returns the metadata of the current map state.
   * @returns {MapMetadata}
   */
  get map_metadata() {
    const ret = wasm.flashlight_map_metadata(this.__wbg_ptr);
    return MapMetadata.__wrap(ret);
  }
  /**
   * This function returns the current state of the visibility map as a `Uint32Array`.
   *
   * The visibility state is represented as a vector of `u8` values, where each value
   * corresponds to a TileType.
   * @returns {Int32Array}
   */
  get visibility_state() {
    const ret = wasm.flashlight_visibility_state(this.__wbg_ptr);
    return ret;
  }
  compute_visibility() {
    wasm.flashlight_compute_visibility(this.__wbg_ptr);
  }
  /**
   * @param {Uint8Array} state_vector
   */
  apply_initial_state_vector_js(state_vector) {
    wasm.flashlight_apply_initial_state_vector_js(this.__wbg_ptr, state_vector);
  }
  /**
   * @param {Uint8Array} delta
   */
  apply_delta_js(delta) {
    wasm.flashlight_apply_delta_js(this.__wbg_ptr, delta);
  }
  /**
   * This function allows the user to select a cell on the map.
   * @param {Vec2} pos
   * @returns {MoveOutcome}
   */
  do_move_player(pos) {
    _assertClass(pos, Vec2);
    var ptr0 = pos.__destroy_into_raw();
    const ret = wasm.flashlight_do_move_player(this.__wbg_ptr, ptr0);
    return ret;
  }
  /**
   * This function checks whether the full map is solvable.
   * Does not apply visibility and camera clipping masks to map state.
   * @returns {boolean}
   */
  is_solvable() {
    const ret = wasm.flashlight_is_solvable(this.__wbg_ptr);
    return ret !== 0;
  }
  /**
   * This function moves the monster towards the player.
   * @returns {MoveOutcome}
   */
  do_move_enemy() {
    const ret = wasm.flashlight_do_move_enemy(this.__wbg_ptr);
    return ret;
  }
};
var MapMetadataFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_mapmetadata_free(ptr >>> 0, 1));
var MapMetadata = class _MapMetadata {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(_MapMetadata.prototype);
    obj.__wbg_ptr = ptr;
    MapMetadataFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    MapMetadataFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_mapmetadata_free(ptr, 0);
  }
  /**
   * @returns {number}
   */
  get target_cell_idx() {
    const ret = wasm.__wbg_get_mapmetadata_target_cell_idx(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set target_cell_idx(arg0) {
    wasm.__wbg_set_mapmetadata_target_cell_idx(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get player_cell_idx() {
    const ret = wasm.__wbg_get_mapmetadata_player_cell_idx(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set player_cell_idx(arg0) {
    wasm.__wbg_set_mapmetadata_player_cell_idx(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get width() {
    const ret = wasm.__wbg_get_mapmetadata_width(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set width(arg0) {
    wasm.__wbg_set_mapmetadata_width(this.__wbg_ptr, arg0);
  }
};
var MoveFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_move_free(ptr >>> 0, 1));
var Vec2Finalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_vec2_free(ptr >>> 0, 1));
var Vec2 = class _Vec2 {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(_Vec2.prototype);
    obj.__wbg_ptr = ptr;
    Vec2Finalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    Vec2Finalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_vec2_free(ptr, 0);
  }
  /**
   * @returns {number}
   */
  get 0() {
    const ret = wasm.__wbg_get_mapmetadata_player_cell_idx(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set 0(arg0) {
    wasm.__wbg_set_mapmetadata_player_cell_idx(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get 1() {
    const ret = wasm.__wbg_get_vec2_1(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set 1(arg0) {
    wasm.__wbg_set_vec2_1(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {Vec2}
   */
  static new() {
    const ret = wasm.vec2_new();
    return _Vec2.__wrap(ret);
  }
  /**
   * @param {number} x
   * @param {number} y
   * @returns {Vec2}
   */
  static new_with_data(x, y) {
    const ret = wasm.vec2_new_with_data(x, y);
    return _Vec2.__wrap(ret);
  }
};
function __wbg_buffer_609cc3eee51ed158(arg0) {
  const ret = arg0.buffer;
  return ret;
}
function __wbg_call_672a4d21634d4a24() {
  return handleError(function(arg0, arg1) {
    const ret = arg0.call(arg1);
    return ret;
  }, arguments);
}
function __wbg_call_7cccdd69e0791ae2() {
  return handleError(function(arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
  }, arguments);
}
function __wbg_crypto_574e78ad8b13b65f(arg0) {
  const ret = arg0.crypto;
  return ret;
}
function __wbg_getRandomValues_b8f5dbd5f3995a9e() {
  return handleError(function(arg0, arg1) {
    arg0.getRandomValues(arg1);
  }, arguments);
}
function __wbg_length_a446193dc22c12f8(arg0) {
  const ret = arg0.length;
  return ret;
}
function __wbg_msCrypto_a61aeb35a24c1329(arg0) {
  const ret = arg0.msCrypto;
  return ret;
}
function __wbg_new_a12002a7f91c75be(arg0) {
  const ret = new Uint8Array(arg0);
  return ret;
}
function __wbg_new_e9a4a67dbababe57(arg0) {
  const ret = new Int32Array(arg0);
  return ret;
}
function __wbg_newnoargs_105ed471475aaf50(arg0, arg1) {
  const ret = new Function(getStringFromWasm0(arg0, arg1));
  return ret;
}
function __wbg_newwithbyteoffsetandlength_999332a180064b59(arg0, arg1, arg2) {
  const ret = new Int32Array(arg0, arg1 >>> 0, arg2 >>> 0);
  return ret;
}
function __wbg_newwithbyteoffsetandlength_d97e637ebe145a9a(arg0, arg1, arg2) {
  const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
  return ret;
}
function __wbg_newwithlength_a381634e90c276d4(arg0) {
  const ret = new Uint8Array(arg0 >>> 0);
  return ret;
}
function __wbg_node_905d3e251edff8a2(arg0) {
  const ret = arg0.node;
  return ret;
}
function __wbg_process_dc0fbacc7c1c06f7(arg0) {
  const ret = arg0.process;
  return ret;
}
function __wbg_randomFillSync_ac0988aba3254290() {
  return handleError(function(arg0, arg1) {
    arg0.randomFillSync(arg1);
  }, arguments);
}
function __wbg_require_60cc747a6bc5215a() {
  return handleError(function() {
    const ret = module.require;
    return ret;
  }, arguments);
}
function __wbg_sendDelta_c30907aca36281e8(arg0, arg1) {
  sendDelta(getArrayU8FromWasm0(arg0, arg1));
}
function __wbg_sendInitialStateVector_4b929691eae4fdea(arg0, arg1) {
  sendInitialStateVector(getArrayU8FromWasm0(arg0, arg1));
}
function __wbg_set_65595bdd868b3009(arg0, arg1, arg2) {
  arg0.set(arg1, arg2 >>> 0);
}
function __wbg_static_accessor_GLOBAL_88a902d13a557d07() {
  const ret = typeof global === "undefined" ? null : global;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0() {
  const ret = typeof globalThis === "undefined" ? null : globalThis;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_static_accessor_SELF_37c5d418e4bf5819() {
  const ret = typeof self === "undefined" ? null : self;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_static_accessor_WINDOW_5de37043a91a9c40() {
  const ret = typeof window === "undefined" ? null : window;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
function __wbg_subarray_aa9065fa9dc5df96(arg0, arg1, arg2) {
  const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
  return ret;
}
function __wbg_versions_c01dfd4722a88165(arg0) {
  const ret = arg0.versions;
  return ret;
}
function __wbindgen_init_externref_table() {
  const table = wasm.__wbindgen_export_2;
  const offset = table.grow(4);
  table.set(0, void 0);
  table.set(offset + 0, void 0);
  table.set(offset + 1, null);
  table.set(offset + 2, true);
  table.set(offset + 3, false);
  ;
}
function __wbindgen_is_function(arg0) {
  const ret = typeof arg0 === "function";
  return ret;
}
function __wbindgen_is_object(arg0) {
  const val = arg0;
  const ret = typeof val === "object" && val !== null;
  return ret;
}
function __wbindgen_is_string(arg0) {
  const ret = typeof arg0 === "string";
  return ret;
}
function __wbindgen_is_undefined(arg0) {
  const ret = arg0 === void 0;
  return ret;
}
function __wbindgen_memory() {
  const ret = wasm.memory;
  return ret;
}
function __wbindgen_number_get(arg0, arg1) {
  const obj = arg1;
  const ret = typeof obj === "number" ? obj : void 0;
  getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
  getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
}
function __wbindgen_number_new(arg0) {
  const ret = arg0;
  return ret;
}
function __wbindgen_string_new(arg0, arg1) {
  const ret = getStringFromWasm0(arg0, arg1);
  return ret;
}
function __wbindgen_throw(arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1));
}
function __wbindgen_try_into_number(arg0) {
  let result;
  try {
    result = +arg0;
  } catch (e) {
    result = e;
  }
  const ret = result;
  return ret;
}

// wasm-module:/Users/tauseefk/personal/rust/flashes/www/engine/flashlight_bg.wasm
var imports = {
  ["./flashlight_bg.js"]: {
    __wbg_sendInitialStateVector_4b929691eae4fdea,
    __wbindgen_try_into_number,
    __wbindgen_number_get,
    __wbindgen_number_new,
    __wbindgen_memory,
    __wbg_buffer_609cc3eee51ed158,
    __wbg_newwithbyteoffsetandlength_999332a180064b59,
    __wbg_new_e9a4a67dbababe57,
    __wbg_sendDelta_c30907aca36281e8,
    __wbg_subarray_aa9065fa9dc5df96,
    __wbg_getRandomValues_b8f5dbd5f3995a9e,
    __wbg_new_a12002a7f91c75be,
    __wbg_set_65595bdd868b3009,
    __wbg_newwithbyteoffsetandlength_d97e637ebe145a9a,
    __wbg_randomFillSync_ac0988aba3254290,
    __wbg_crypto_574e78ad8b13b65f,
    __wbindgen_is_object,
    __wbg_process_dc0fbacc7c1c06f7,
    __wbg_versions_c01dfd4722a88165,
    __wbg_node_905d3e251edff8a2,
    __wbindgen_is_string,
    __wbg_require_60cc747a6bc5215a,
    __wbindgen_is_function,
    __wbindgen_string_new,
    __wbg_call_7cccdd69e0791ae2,
    __wbg_msCrypto_a61aeb35a24c1329,
    __wbg_newwithlength_a381634e90c276d4,
    __wbindgen_is_undefined,
    __wbg_newnoargs_105ed471475aaf50,
    __wbg_call_672a4d21634d4a24,
    __wbg_static_accessor_GLOBAL_88a902d13a557d07,
    __wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0,
    __wbg_static_accessor_WINDOW_5de37043a91a9c40,
    __wbg_static_accessor_SELF_37c5d418e4bf5819,
    __wbg_length_a446193dc22c12f8,
    __wbindgen_throw,
    __wbindgen_init_externref_table
  }
};
async function loadWasm(module3, imports2) {
  if (typeof module3 === "string") {
    if (module3.startsWith("./")) {
      module3 = new URL(module3, import.meta.url).href;
    }
    const moduleRequest = await fetch(module3);
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(moduleRequest, imports2);
      } catch (e) {
        if (moduleRequest.headers.get("Content-Type") != "application/wasm") {
          console.warn(e);
        } else {
          throw e;
        }
      }
    }
    module3 = await moduleRequest.arrayBuffer();
  }
  return await WebAssembly.instantiate(module3, imports2);
}
var { instance, module: module2 } = await loadWasm(flashlight_bg_default, imports);
var memory = instance.exports.memory;
var __wbg_mapmetadata_free = instance.exports.__wbg_mapmetadata_free;
var __wbg_get_mapmetadata_target_cell_idx = instance.exports.__wbg_get_mapmetadata_target_cell_idx;
var __wbg_set_mapmetadata_target_cell_idx = instance.exports.__wbg_set_mapmetadata_target_cell_idx;
var __wbg_get_mapmetadata_player_cell_idx = instance.exports.__wbg_get_mapmetadata_player_cell_idx;
var __wbg_set_mapmetadata_player_cell_idx = instance.exports.__wbg_set_mapmetadata_player_cell_idx;
var __wbg_get_mapmetadata_width = instance.exports.__wbg_get_mapmetadata_width;
var __wbg_set_mapmetadata_width = instance.exports.__wbg_set_mapmetadata_width;
var __wbg_flashlight_free = instance.exports.__wbg_flashlight_free;
var __wbg_get_flashlight_width = instance.exports.__wbg_get_flashlight_width;
var __wbg_set_flashlight_width = instance.exports.__wbg_set_flashlight_width;
var __wbg_get_flashlight_view_width = instance.exports.__wbg_get_flashlight_view_width;
var __wbg_set_flashlight_view_width = instance.exports.__wbg_set_flashlight_view_width;
var __wbg_get_flashlight_player_poise = instance.exports.__wbg_get_flashlight_player_poise;
var __wbg_set_flashlight_player_poise = instance.exports.__wbg_set_flashlight_player_poise;
var __wbg_get_flashlight_monster_poise = instance.exports.__wbg_get_flashlight_monster_poise;
var __wbg_set_flashlight_monster_poise = instance.exports.__wbg_set_flashlight_monster_poise;
var flashlight_new = instance.exports.flashlight_new;
var flashlight_new_from_js = instance.exports.flashlight_new_from_js;
var flashlight_get_clipped_map_state = instance.exports.flashlight_get_clipped_map_state;
var flashlight_map_metadata = instance.exports.flashlight_map_metadata;
var flashlight_visibility_state = instance.exports.flashlight_visibility_state;
var flashlight_compute_visibility = instance.exports.flashlight_compute_visibility;
var flashlight_apply_initial_state_vector_js = instance.exports.flashlight_apply_initial_state_vector_js;
var flashlight_apply_delta_js = instance.exports.flashlight_apply_delta_js;
var flashlight_do_move_player = instance.exports.flashlight_do_move_player;
var flashlight_is_solvable = instance.exports.flashlight_is_solvable;
var flashlight_do_move_enemy = instance.exports.flashlight_do_move_enemy;
var __wbg_vec2_free = instance.exports.__wbg_vec2_free;
var __wbg_get_vec2_1 = instance.exports.__wbg_get_vec2_1;
var __wbg_set_vec2_1 = instance.exports.__wbg_set_vec2_1;
var vec2_new = instance.exports.vec2_new;
var vec2_new_with_data = instance.exports.vec2_new_with_data;
var __wbg_move_free = instance.exports.__wbg_move_free;
var __wbg_get_move_from = instance.exports.__wbg_get_move_from;
var __wbg_set_move_from = instance.exports.__wbg_set_move_from;
var __wbg_get_move_to = instance.exports.__wbg_get_move_to;
var __wbg_set_move_to = instance.exports.__wbg_set_move_to;
var move_new = instance.exports.move_new;
var move_new_with_data = instance.exports.move_new_with_data;
var __wbg_set_vec2_0 = instance.exports.__wbg_set_vec2_0;
var __wbg_get_vec2_0 = instance.exports.__wbg_get_vec2_0;
var __wbindgen_exn_store = instance.exports.__wbindgen_exn_store;
var __externref_table_alloc = instance.exports.__externref_table_alloc;
var __wbindgen_export_2 = instance.exports.__wbindgen_export_2;
var __wbindgen_malloc = instance.exports.__wbindgen_malloc;
var __externref_drop_slice = instance.exports.__externref_drop_slice;
var __wbindgen_free = instance.exports.__wbindgen_free;
var __wbindgen_start = instance.exports.__wbindgen_start;

// engine/flashlight.js
__wbg_set_wasm(flashlight_bg_exports);
__wbindgen_start();

// node_modules/peerjs-js-binarypack/dist/binarypack.mjs
var $e8379818650e2442$export$93654d4f2d6cd524 = class {
  constructor() {
    this.encoder = new TextEncoder();
    this._pieces = [];
    this._parts = [];
  }
  append_buffer(data) {
    this.flush();
    this._parts.push(data);
  }
  append(data) {
    this._pieces.push(data);
  }
  flush() {
    if (this._pieces.length > 0) {
      const buf = new Uint8Array(this._pieces);
      this._parts.push(buf);
      this._pieces = [];
    }
  }
  toArrayBuffer() {
    const buffer = [];
    for (const part of this._parts) buffer.push(part);
    return $e8379818650e2442$var$concatArrayBuffers(buffer).buffer;
  }
};
function $e8379818650e2442$var$concatArrayBuffers(bufs) {
  let size = 0;
  for (const buf of bufs) size += buf.byteLength;
  const result = new Uint8Array(size);
  let offset = 0;
  for (const buf of bufs) {
    const view = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    result.set(view, offset);
    offset += buf.byteLength;
  }
  return result;
}
function $0cfd7828ad59115f$export$417857010dc9287f(data) {
  const unpacker = new $0cfd7828ad59115f$var$Unpacker(data);
  return unpacker.unpack();
}
function $0cfd7828ad59115f$export$2a703dbb0cb35339(data) {
  const packer = new $0cfd7828ad59115f$export$b9ec4b114aa40074();
  const res = packer.pack(data);
  if (res instanceof Promise) return res.then(() => packer.getBuffer());
  return packer.getBuffer();
}
var $0cfd7828ad59115f$var$Unpacker = class {
  constructor(data) {
    this.index = 0;
    this.dataBuffer = data;
    this.dataView = new Uint8Array(this.dataBuffer);
    this.length = this.dataBuffer.byteLength;
  }
  unpack() {
    const type = this.unpack_uint8();
    if (type < 128) return type;
    else if ((type ^ 224) < 32) return (type ^ 224) - 32;
    let size;
    if ((size = type ^ 160) <= 15) return this.unpack_raw(size);
    else if ((size = type ^ 176) <= 15) return this.unpack_string(size);
    else if ((size = type ^ 144) <= 15) return this.unpack_array(size);
    else if ((size = type ^ 128) <= 15) return this.unpack_map(size);
    switch (type) {
      case 192:
        return null;
      case 193:
        return void 0;
      case 194:
        return false;
      case 195:
        return true;
      case 202:
        return this.unpack_float();
      case 203:
        return this.unpack_double();
      case 204:
        return this.unpack_uint8();
      case 205:
        return this.unpack_uint16();
      case 206:
        return this.unpack_uint32();
      case 207:
        return this.unpack_uint64();
      case 208:
        return this.unpack_int8();
      case 209:
        return this.unpack_int16();
      case 210:
        return this.unpack_int32();
      case 211:
        return this.unpack_int64();
      case 212:
        return void 0;
      case 213:
        return void 0;
      case 214:
        return void 0;
      case 215:
        return void 0;
      case 216:
        size = this.unpack_uint16();
        return this.unpack_string(size);
      case 217:
        size = this.unpack_uint32();
        return this.unpack_string(size);
      case 218:
        size = this.unpack_uint16();
        return this.unpack_raw(size);
      case 219:
        size = this.unpack_uint32();
        return this.unpack_raw(size);
      case 220:
        size = this.unpack_uint16();
        return this.unpack_array(size);
      case 221:
        size = this.unpack_uint32();
        return this.unpack_array(size);
      case 222:
        size = this.unpack_uint16();
        return this.unpack_map(size);
      case 223:
        size = this.unpack_uint32();
        return this.unpack_map(size);
    }
  }
  unpack_uint8() {
    const byte = this.dataView[this.index] & 255;
    this.index++;
    return byte;
  }
  unpack_uint16() {
    const bytes = this.read(2);
    const uint16 = (bytes[0] & 255) * 256 + (bytes[1] & 255);
    this.index += 2;
    return uint16;
  }
  unpack_uint32() {
    const bytes = this.read(4);
    const uint32 = ((bytes[0] * 256 + bytes[1]) * 256 + bytes[2]) * 256 + bytes[3];
    this.index += 4;
    return uint32;
  }
  unpack_uint64() {
    const bytes = this.read(8);
    const uint64 = ((((((bytes[0] * 256 + bytes[1]) * 256 + bytes[2]) * 256 + bytes[3]) * 256 + bytes[4]) * 256 + bytes[5]) * 256 + bytes[6]) * 256 + bytes[7];
    this.index += 8;
    return uint64;
  }
  unpack_int8() {
    const uint8 = this.unpack_uint8();
    return uint8 < 128 ? uint8 : uint8 - 256;
  }
  unpack_int16() {
    const uint16 = this.unpack_uint16();
    return uint16 < 32768 ? uint16 : uint16 - 65536;
  }
  unpack_int32() {
    const uint32 = this.unpack_uint32();
    return uint32 < 2 ** 31 ? uint32 : uint32 - 2 ** 32;
  }
  unpack_int64() {
    const uint64 = this.unpack_uint64();
    return uint64 < 2 ** 63 ? uint64 : uint64 - 2 ** 64;
  }
  unpack_raw(size) {
    if (this.length < this.index + size) throw new Error(`BinaryPackFailure: index is out of range ${this.index} ${size} ${this.length}`);
    const buf = this.dataBuffer.slice(this.index, this.index + size);
    this.index += size;
    return buf;
  }
  unpack_string(size) {
    const bytes = this.read(size);
    let i2 = 0;
    let str = "";
    let c;
    let code;
    while (i2 < size) {
      c = bytes[i2];
      if (c < 160) {
        code = c;
        i2++;
      } else if ((c ^ 192) < 32) {
        code = (c & 31) << 6 | bytes[i2 + 1] & 63;
        i2 += 2;
      } else if ((c ^ 224) < 16) {
        code = (c & 15) << 12 | (bytes[i2 + 1] & 63) << 6 | bytes[i2 + 2] & 63;
        i2 += 3;
      } else {
        code = (c & 7) << 18 | (bytes[i2 + 1] & 63) << 12 | (bytes[i2 + 2] & 63) << 6 | bytes[i2 + 3] & 63;
        i2 += 4;
      }
      str += String.fromCodePoint(code);
    }
    this.index += size;
    return str;
  }
  unpack_array(size) {
    const objects = new Array(size);
    for (let i2 = 0; i2 < size; i2++) objects[i2] = this.unpack();
    return objects;
  }
  unpack_map(size) {
    const map = {};
    for (let i2 = 0; i2 < size; i2++) {
      const key = this.unpack();
      map[key] = this.unpack();
    }
    return map;
  }
  unpack_float() {
    const uint32 = this.unpack_uint32();
    const sign = uint32 >> 31;
    const exp = (uint32 >> 23 & 255) - 127;
    const fraction = uint32 & 8388607 | 8388608;
    return (sign === 0 ? 1 : -1) * fraction * 2 ** (exp - 23);
  }
  unpack_double() {
    const h32 = this.unpack_uint32();
    const l32 = this.unpack_uint32();
    const sign = h32 >> 31;
    const exp = (h32 >> 20 & 2047) - 1023;
    const hfrac = h32 & 1048575 | 1048576;
    const frac = hfrac * 2 ** (exp - 20) + l32 * 2 ** (exp - 52);
    return (sign === 0 ? 1 : -1) * frac;
  }
  read(length) {
    const j = this.index;
    if (j + length <= this.length) return this.dataView.subarray(j, j + length);
    else throw new Error("BinaryPackFailure: read index out of range");
  }
};
var $0cfd7828ad59115f$export$b9ec4b114aa40074 = class {
  getBuffer() {
    return this._bufferBuilder.toArrayBuffer();
  }
  pack(value) {
    if (typeof value === "string") this.pack_string(value);
    else if (typeof value === "number") {
      if (Math.floor(value) === value) this.pack_integer(value);
      else this.pack_double(value);
    } else if (typeof value === "boolean") {
      if (value === true) this._bufferBuilder.append(195);
      else if (value === false) this._bufferBuilder.append(194);
    } else if (value === void 0) this._bufferBuilder.append(192);
    else if (typeof value === "object") {
      if (value === null) this._bufferBuilder.append(192);
      else {
        const constructor = value.constructor;
        if (value instanceof Array) {
          const res = this.pack_array(value);
          if (res instanceof Promise) return res.then(() => this._bufferBuilder.flush());
        } else if (value instanceof ArrayBuffer) this.pack_bin(new Uint8Array(value));
        else if ("BYTES_PER_ELEMENT" in value) {
          const v = value;
          this.pack_bin(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
        } else if (value instanceof Date) this.pack_string(value.toString());
        else if (value instanceof Blob) return value.arrayBuffer().then((buffer) => {
          this.pack_bin(new Uint8Array(buffer));
          this._bufferBuilder.flush();
        });
        else if (constructor == Object || constructor.toString().startsWith("class")) {
          const res = this.pack_object(value);
          if (res instanceof Promise) return res.then(() => this._bufferBuilder.flush());
        } else throw new Error(`Type "${constructor.toString()}" not yet supported`);
      }
    } else throw new Error(`Type "${typeof value}" not yet supported`);
    this._bufferBuilder.flush();
  }
  pack_bin(blob) {
    const length = blob.length;
    if (length <= 15) this.pack_uint8(160 + length);
    else if (length <= 65535) {
      this._bufferBuilder.append(218);
      this.pack_uint16(length);
    } else if (length <= 4294967295) {
      this._bufferBuilder.append(219);
      this.pack_uint32(length);
    } else throw new Error("Invalid length");
    this._bufferBuilder.append_buffer(blob);
  }
  pack_string(str) {
    const encoded = this._textEncoder.encode(str);
    const length = encoded.length;
    if (length <= 15) this.pack_uint8(176 + length);
    else if (length <= 65535) {
      this._bufferBuilder.append(216);
      this.pack_uint16(length);
    } else if (length <= 4294967295) {
      this._bufferBuilder.append(217);
      this.pack_uint32(length);
    } else throw new Error("Invalid length");
    this._bufferBuilder.append_buffer(encoded);
  }
  pack_array(ary) {
    const length = ary.length;
    if (length <= 15) this.pack_uint8(144 + length);
    else if (length <= 65535) {
      this._bufferBuilder.append(220);
      this.pack_uint16(length);
    } else if (length <= 4294967295) {
      this._bufferBuilder.append(221);
      this.pack_uint32(length);
    } else throw new Error("Invalid length");
    const packNext = (index) => {
      if (index < length) {
        const res = this.pack(ary[index]);
        if (res instanceof Promise) return res.then(() => packNext(index + 1));
        return packNext(index + 1);
      }
    };
    return packNext(0);
  }
  pack_integer(num) {
    if (num >= -32 && num <= 127) this._bufferBuilder.append(num & 255);
    else if (num >= 0 && num <= 255) {
      this._bufferBuilder.append(204);
      this.pack_uint8(num);
    } else if (num >= -128 && num <= 127) {
      this._bufferBuilder.append(208);
      this.pack_int8(num);
    } else if (num >= 0 && num <= 65535) {
      this._bufferBuilder.append(205);
      this.pack_uint16(num);
    } else if (num >= -32768 && num <= 32767) {
      this._bufferBuilder.append(209);
      this.pack_int16(num);
    } else if (num >= 0 && num <= 4294967295) {
      this._bufferBuilder.append(206);
      this.pack_uint32(num);
    } else if (num >= -2147483648 && num <= 2147483647) {
      this._bufferBuilder.append(210);
      this.pack_int32(num);
    } else if (num >= -9223372036854776e3 && num <= 9223372036854776e3) {
      this._bufferBuilder.append(211);
      this.pack_int64(num);
    } else if (num >= 0 && num <= 18446744073709552e3) {
      this._bufferBuilder.append(207);
      this.pack_uint64(num);
    } else throw new Error("Invalid integer");
  }
  pack_double(num) {
    let sign = 0;
    if (num < 0) {
      sign = 1;
      num = -num;
    }
    const exp = Math.floor(Math.log(num) / Math.LN2);
    const frac0 = num / 2 ** exp - 1;
    const frac1 = Math.floor(frac0 * 2 ** 52);
    const b32 = 2 ** 32;
    const h32 = sign << 31 | exp + 1023 << 20 | frac1 / b32 & 1048575;
    const l32 = frac1 % b32;
    this._bufferBuilder.append(203);
    this.pack_int32(h32);
    this.pack_int32(l32);
  }
  pack_object(obj) {
    const keys = Object.keys(obj);
    const length = keys.length;
    if (length <= 15) this.pack_uint8(128 + length);
    else if (length <= 65535) {
      this._bufferBuilder.append(222);
      this.pack_uint16(length);
    } else if (length <= 4294967295) {
      this._bufferBuilder.append(223);
      this.pack_uint32(length);
    } else throw new Error("Invalid length");
    const packNext = (index) => {
      if (index < keys.length) {
        const prop = keys[index];
        if (obj.hasOwnProperty(prop)) {
          this.pack(prop);
          const res = this.pack(obj[prop]);
          if (res instanceof Promise) return res.then(() => packNext(index + 1));
        }
        return packNext(index + 1);
      }
    };
    return packNext(0);
  }
  pack_uint8(num) {
    this._bufferBuilder.append(num);
  }
  pack_uint16(num) {
    this._bufferBuilder.append(num >> 8);
    this._bufferBuilder.append(num & 255);
  }
  pack_uint32(num) {
    const n = num & 4294967295;
    this._bufferBuilder.append((n & 4278190080) >>> 24);
    this._bufferBuilder.append((n & 16711680) >>> 16);
    this._bufferBuilder.append((n & 65280) >>> 8);
    this._bufferBuilder.append(n & 255);
  }
  pack_uint64(num) {
    const high = num / 2 ** 32;
    const low = num % 2 ** 32;
    this._bufferBuilder.append((high & 4278190080) >>> 24);
    this._bufferBuilder.append((high & 16711680) >>> 16);
    this._bufferBuilder.append((high & 65280) >>> 8);
    this._bufferBuilder.append(high & 255);
    this._bufferBuilder.append((low & 4278190080) >>> 24);
    this._bufferBuilder.append((low & 16711680) >>> 16);
    this._bufferBuilder.append((low & 65280) >>> 8);
    this._bufferBuilder.append(low & 255);
  }
  pack_int8(num) {
    this._bufferBuilder.append(num & 255);
  }
  pack_int16(num) {
    this._bufferBuilder.append((num & 65280) >> 8);
    this._bufferBuilder.append(num & 255);
  }
  pack_int32(num) {
    this._bufferBuilder.append(num >>> 24 & 255);
    this._bufferBuilder.append((num & 16711680) >>> 16);
    this._bufferBuilder.append((num & 65280) >>> 8);
    this._bufferBuilder.append(num & 255);
  }
  pack_int64(num) {
    const high = Math.floor(num / 2 ** 32);
    const low = num % 2 ** 32;
    this._bufferBuilder.append((high & 4278190080) >>> 24);
    this._bufferBuilder.append((high & 16711680) >>> 16);
    this._bufferBuilder.append((high & 65280) >>> 8);
    this._bufferBuilder.append(high & 255);
    this._bufferBuilder.append((low & 4278190080) >>> 24);
    this._bufferBuilder.append((low & 16711680) >>> 16);
    this._bufferBuilder.append((low & 65280) >>> 8);
    this._bufferBuilder.append(low & 255);
  }
  constructor() {
    this._bufferBuilder = new (0, $e8379818650e2442$export$93654d4f2d6cd524)();
    this._textEncoder = new TextEncoder();
  }
};

// node_modules/webrtc-adapter/src/js/utils.js
var logDisabled_ = true;
var deprecationWarnings_ = true;
function extractVersion(uastring, expr, pos) {
  const match = uastring.match(expr);
  return match && match.length >= pos && parseFloat(match[pos], 10);
}
function wrapPeerConnectionEvent(window2, eventNameToWrap, wrapper) {
  if (!window2.RTCPeerConnection) {
    return;
  }
  const proto = window2.RTCPeerConnection.prototype;
  const nativeAddEventListener = proto.addEventListener;
  proto.addEventListener = function(nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap) {
      return nativeAddEventListener.apply(this, arguments);
    }
    const wrappedCallback = (e) => {
      const modifiedEvent = wrapper(e);
      if (modifiedEvent) {
        if (cb.handleEvent) {
          cb.handleEvent(modifiedEvent);
        } else {
          cb(modifiedEvent);
        }
      }
    };
    this._eventMap = this._eventMap || {};
    if (!this._eventMap[eventNameToWrap]) {
      this._eventMap[eventNameToWrap] = /* @__PURE__ */ new Map();
    }
    this._eventMap[eventNameToWrap].set(cb, wrappedCallback);
    return nativeAddEventListener.apply(this, [
      nativeEventName,
      wrappedCallback
    ]);
  };
  const nativeRemoveEventListener = proto.removeEventListener;
  proto.removeEventListener = function(nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap || !this._eventMap || !this._eventMap[eventNameToWrap]) {
      return nativeRemoveEventListener.apply(this, arguments);
    }
    if (!this._eventMap[eventNameToWrap].has(cb)) {
      return nativeRemoveEventListener.apply(this, arguments);
    }
    const unwrappedCb = this._eventMap[eventNameToWrap].get(cb);
    this._eventMap[eventNameToWrap].delete(cb);
    if (this._eventMap[eventNameToWrap].size === 0) {
      delete this._eventMap[eventNameToWrap];
    }
    if (Object.keys(this._eventMap).length === 0) {
      delete this._eventMap;
    }
    return nativeRemoveEventListener.apply(this, [
      nativeEventName,
      unwrappedCb
    ]);
  };
  Object.defineProperty(proto, "on" + eventNameToWrap, {
    get() {
      return this["_on" + eventNameToWrap];
    },
    set(cb) {
      if (this["_on" + eventNameToWrap]) {
        this.removeEventListener(
          eventNameToWrap,
          this["_on" + eventNameToWrap]
        );
        delete this["_on" + eventNameToWrap];
      }
      if (cb) {
        this.addEventListener(
          eventNameToWrap,
          this["_on" + eventNameToWrap] = cb
        );
      }
    },
    enumerable: true,
    configurable: true
  });
}
function disableLog(bool) {
  if (typeof bool !== "boolean") {
    return new Error("Argument type: " + typeof bool + ". Please use a boolean.");
  }
  logDisabled_ = bool;
  return bool ? "adapter.js logging disabled" : "adapter.js logging enabled";
}
function disableWarnings(bool) {
  if (typeof bool !== "boolean") {
    return new Error("Argument type: " + typeof bool + ". Please use a boolean.");
  }
  deprecationWarnings_ = !bool;
  return "adapter.js deprecation warnings " + (bool ? "disabled" : "enabled");
}
function log() {
  if (typeof window === "object") {
    if (logDisabled_) {
      return;
    }
    if (typeof console !== "undefined" && typeof console.log === "function") {
      console.log.apply(console, arguments);
    }
  }
}
function deprecated(oldMethod, newMethod) {
  if (!deprecationWarnings_) {
    return;
  }
  console.warn(oldMethod + " is deprecated, please use " + newMethod + " instead.");
}
function detectBrowser(window2) {
  const result = { browser: null, version: null };
  if (typeof window2 === "undefined" || !window2.navigator || !window2.navigator.userAgent) {
    result.browser = "Not a browser.";
    return result;
  }
  const { navigator: navigator2 } = window2;
  if (navigator2.userAgentData && navigator2.userAgentData.brands) {
    const chromium = navigator2.userAgentData.brands.find((brand) => {
      return brand.brand === "Chromium";
    });
    if (chromium) {
      return { browser: "chrome", version: parseInt(chromium.version, 10) };
    }
  }
  if (navigator2.mozGetUserMedia) {
    result.browser = "firefox";
    result.version = parseInt(extractVersion(
      navigator2.userAgent,
      /Firefox\/(\d+)\./,
      1
    ));
  } else if (navigator2.webkitGetUserMedia || window2.isSecureContext === false && window2.webkitRTCPeerConnection) {
    result.browser = "chrome";
    result.version = parseInt(extractVersion(
      navigator2.userAgent,
      /Chrom(e|ium)\/(\d+)\./,
      2
    ));
  } else if (window2.RTCPeerConnection && navigator2.userAgent.match(/AppleWebKit\/(\d+)\./)) {
    result.browser = "safari";
    result.version = parseInt(extractVersion(
      navigator2.userAgent,
      /AppleWebKit\/(\d+)\./,
      1
    ));
    result.supportsUnifiedPlan = window2.RTCRtpTransceiver && "currentDirection" in window2.RTCRtpTransceiver.prototype;
    result._safariVersion = extractVersion(
      navigator2.userAgent,
      /Version\/(\d+(\.?\d+))/,
      1
    );
  } else {
    result.browser = "Not a supported browser.";
    return result;
  }
  return result;
}
function isObject(val) {
  return Object.prototype.toString.call(val) === "[object Object]";
}
function compactObject(data) {
  if (!isObject(data)) {
    return data;
  }
  return Object.keys(data).reduce(function(accumulator, key) {
    const isObj = isObject(data[key]);
    const value = isObj ? compactObject(data[key]) : data[key];
    const isEmptyObject = isObj && !Object.keys(value).length;
    if (value === void 0 || isEmptyObject) {
      return accumulator;
    }
    return Object.assign(accumulator, { [key]: value });
  }, {});
}
function walkStats(stats, base, resultSet) {
  if (!base || resultSet.has(base.id)) {
    return;
  }
  resultSet.set(base.id, base);
  Object.keys(base).forEach((name) => {
    if (name.endsWith("Id")) {
      walkStats(stats, stats.get(base[name]), resultSet);
    } else if (name.endsWith("Ids")) {
      base[name].forEach((id) => {
        walkStats(stats, stats.get(id), resultSet);
      });
    }
  });
}
function filterStats(result, track, outbound) {
  const streamStatsType = outbound ? "outbound-rtp" : "inbound-rtp";
  const filteredResult = /* @__PURE__ */ new Map();
  if (track === null) {
    return filteredResult;
  }
  const trackStats = [];
  result.forEach((value) => {
    if (value.type === "track" && value.trackIdentifier === track.id) {
      trackStats.push(value);
    }
  });
  trackStats.forEach((trackStat) => {
    result.forEach((stats) => {
      if (stats.type === streamStatsType && stats.trackId === trackStat.id) {
        walkStats(result, stats, filteredResult);
      }
    });
  });
  return filteredResult;
}

// node_modules/webrtc-adapter/src/js/chrome/chrome_shim.js
var chrome_shim_exports = {};
__export(chrome_shim_exports, {
  fixNegotiationNeeded: () => fixNegotiationNeeded,
  shimAddTrackRemoveTrack: () => shimAddTrackRemoveTrack,
  shimAddTrackRemoveTrackWithNative: () => shimAddTrackRemoveTrackWithNative,
  shimGetSendersWithDtmf: () => shimGetSendersWithDtmf,
  shimGetUserMedia: () => shimGetUserMedia,
  shimMediaStream: () => shimMediaStream,
  shimOnTrack: () => shimOnTrack,
  shimPeerConnection: () => shimPeerConnection,
  shimSenderReceiverGetStats: () => shimSenderReceiverGetStats
});

// node_modules/webrtc-adapter/src/js/chrome/getusermedia.js
var logging = log;
function shimGetUserMedia(window2, browserDetails) {
  const navigator2 = window2 && window2.navigator;
  if (!navigator2.mediaDevices) {
    return;
  }
  const constraintsToChrome_ = function(c) {
    if (typeof c !== "object" || c.mandatory || c.optional) {
      return c;
    }
    const cc = {};
    Object.keys(c).forEach((key) => {
      if (key === "require" || key === "advanced" || key === "mediaSource") {
        return;
      }
      const r = typeof c[key] === "object" ? c[key] : { ideal: c[key] };
      if (r.exact !== void 0 && typeof r.exact === "number") {
        r.min = r.max = r.exact;
      }
      const oldname_ = function(prefix, name) {
        if (prefix) {
          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
        }
        return name === "deviceId" ? "sourceId" : name;
      };
      if (r.ideal !== void 0) {
        cc.optional = cc.optional || [];
        let oc = {};
        if (typeof r.ideal === "number") {
          oc[oldname_("min", key)] = r.ideal;
          cc.optional.push(oc);
          oc = {};
          oc[oldname_("max", key)] = r.ideal;
          cc.optional.push(oc);
        } else {
          oc[oldname_("", key)] = r.ideal;
          cc.optional.push(oc);
        }
      }
      if (r.exact !== void 0 && typeof r.exact !== "number") {
        cc.mandatory = cc.mandatory || {};
        cc.mandatory[oldname_("", key)] = r.exact;
      } else {
        ["min", "max"].forEach((mix) => {
          if (r[mix] !== void 0) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname_(mix, key)] = r[mix];
          }
        });
      }
    });
    if (c.advanced) {
      cc.optional = (cc.optional || []).concat(c.advanced);
    }
    return cc;
  };
  const shimConstraints_ = function(constraints, func) {
    if (browserDetails.version >= 61) {
      return func(constraints);
    }
    constraints = JSON.parse(JSON.stringify(constraints));
    if (constraints && typeof constraints.audio === "object") {
      const remap = function(obj, a, b2) {
        if (a in obj && !(b2 in obj)) {
          obj[b2] = obj[a];
          delete obj[a];
        }
      };
      constraints = JSON.parse(JSON.stringify(constraints));
      remap(constraints.audio, "autoGainControl", "googAutoGainControl");
      remap(constraints.audio, "noiseSuppression", "googNoiseSuppression");
      constraints.audio = constraintsToChrome_(constraints.audio);
    }
    if (constraints && typeof constraints.video === "object") {
      let face = constraints.video.facingMode;
      face = face && (typeof face === "object" ? face : { ideal: face });
      const getSupportedFacingModeLies = browserDetails.version < 66;
      if (face && (face.exact === "user" || face.exact === "environment" || face.ideal === "user" || face.ideal === "environment") && !(navigator2.mediaDevices.getSupportedConstraints && navigator2.mediaDevices.getSupportedConstraints().facingMode && !getSupportedFacingModeLies)) {
        delete constraints.video.facingMode;
        let matches;
        if (face.exact === "environment" || face.ideal === "environment") {
          matches = ["back", "rear"];
        } else if (face.exact === "user" || face.ideal === "user") {
          matches = ["front"];
        }
        if (matches) {
          return navigator2.mediaDevices.enumerateDevices().then((devices) => {
            devices = devices.filter((d2) => d2.kind === "videoinput");
            let dev = devices.find((d2) => matches.some((match) => d2.label.toLowerCase().includes(match)));
            if (!dev && devices.length && matches.includes("back")) {
              dev = devices[devices.length - 1];
            }
            if (dev) {
              constraints.video.deviceId = face.exact ? { exact: dev.deviceId } : { ideal: dev.deviceId };
            }
            constraints.video = constraintsToChrome_(constraints.video);
            logging("chrome: " + JSON.stringify(constraints));
            return func(constraints);
          });
        }
      }
      constraints.video = constraintsToChrome_(constraints.video);
    }
    logging("chrome: " + JSON.stringify(constraints));
    return func(constraints);
  };
  const shimError_ = function(e) {
    if (browserDetails.version >= 64) {
      return e;
    }
    return {
      name: {
        PermissionDeniedError: "NotAllowedError",
        PermissionDismissedError: "NotAllowedError",
        InvalidStateError: "NotAllowedError",
        DevicesNotFoundError: "NotFoundError",
        ConstraintNotSatisfiedError: "OverconstrainedError",
        TrackStartError: "NotReadableError",
        MediaDeviceFailedDueToShutdown: "NotAllowedError",
        MediaDeviceKillSwitchOn: "NotAllowedError",
        TabCaptureError: "AbortError",
        ScreenCaptureError: "AbortError",
        DeviceCaptureError: "AbortError"
      }[e.name] || e.name,
      message: e.message,
      constraint: e.constraint || e.constraintName,
      toString() {
        return this.name + (this.message && ": ") + this.message;
      }
    };
  };
  const getUserMedia_ = function(constraints, onSuccess, onError) {
    shimConstraints_(constraints, (c) => {
      navigator2.webkitGetUserMedia(c, onSuccess, (e) => {
        if (onError) {
          onError(shimError_(e));
        }
      });
    });
  };
  navigator2.getUserMedia = getUserMedia_.bind(navigator2);
  if (navigator2.mediaDevices.getUserMedia) {
    const origGetUserMedia = navigator2.mediaDevices.getUserMedia.bind(navigator2.mediaDevices);
    navigator2.mediaDevices.getUserMedia = function(cs) {
      return shimConstraints_(cs, (c) => origGetUserMedia(c).then((stream) => {
        if (c.audio && !stream.getAudioTracks().length || c.video && !stream.getVideoTracks().length) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          throw new DOMException("", "NotFoundError");
        }
        return stream;
      }, (e) => Promise.reject(shimError_(e))));
    };
  }
}

// node_modules/webrtc-adapter/src/js/chrome/chrome_shim.js
function shimMediaStream(window2) {
  window2.MediaStream = window2.MediaStream || window2.webkitMediaStream;
}
function shimOnTrack(window2) {
  if (typeof window2 === "object" && window2.RTCPeerConnection && !("ontrack" in window2.RTCPeerConnection.prototype)) {
    Object.defineProperty(window2.RTCPeerConnection.prototype, "ontrack", {
      get() {
        return this._ontrack;
      },
      set(f) {
        if (this._ontrack) {
          this.removeEventListener("track", this._ontrack);
        }
        this.addEventListener("track", this._ontrack = f);
      },
      enumerable: true,
      configurable: true
    });
    const origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
    window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
      if (!this._ontrackpoly) {
        this._ontrackpoly = (e) => {
          e.stream.addEventListener("addtrack", (te) => {
            let receiver;
            if (window2.RTCPeerConnection.prototype.getReceivers) {
              receiver = this.getReceivers().find((r) => r.track && r.track.id === te.track.id);
            } else {
              receiver = { track: te.track };
            }
            const event = new Event("track");
            event.track = te.track;
            event.receiver = receiver;
            event.transceiver = { receiver };
            event.streams = [e.stream];
            this.dispatchEvent(event);
          });
          e.stream.getTracks().forEach((track) => {
            let receiver;
            if (window2.RTCPeerConnection.prototype.getReceivers) {
              receiver = this.getReceivers().find((r) => r.track && r.track.id === track.id);
            } else {
              receiver = { track };
            }
            const event = new Event("track");
            event.track = track;
            event.receiver = receiver;
            event.transceiver = { receiver };
            event.streams = [e.stream];
            this.dispatchEvent(event);
          });
        };
        this.addEventListener("addstream", this._ontrackpoly);
      }
      return origSetRemoteDescription.apply(this, arguments);
    };
  } else {
    wrapPeerConnectionEvent(window2, "track", (e) => {
      if (!e.transceiver) {
        Object.defineProperty(
          e,
          "transceiver",
          { value: { receiver: e.receiver } }
        );
      }
      return e;
    });
  }
}
function shimGetSendersWithDtmf(window2) {
  if (typeof window2 === "object" && window2.RTCPeerConnection && !("getSenders" in window2.RTCPeerConnection.prototype) && "createDTMFSender" in window2.RTCPeerConnection.prototype) {
    const shimSenderWithDtmf = function(pc, track) {
      return {
        track,
        get dtmf() {
          if (this._dtmf === void 0) {
            if (track.kind === "audio") {
              this._dtmf = pc.createDTMFSender(track);
            } else {
              this._dtmf = null;
            }
          }
          return this._dtmf;
        },
        _pc: pc
      };
    };
    if (!window2.RTCPeerConnection.prototype.getSenders) {
      window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
        this._senders = this._senders || [];
        return this._senders.slice();
      };
      const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
      window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
        let sender = origAddTrack.apply(this, arguments);
        if (!sender) {
          sender = shimSenderWithDtmf(this, track);
          this._senders.push(sender);
        }
        return sender;
      };
      const origRemoveTrack = window2.RTCPeerConnection.prototype.removeTrack;
      window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
        origRemoveTrack.apply(this, arguments);
        const idx = this._senders.indexOf(sender);
        if (idx !== -1) {
          this._senders.splice(idx, 1);
        }
      };
    }
    const origAddStream = window2.RTCPeerConnection.prototype.addStream;
    window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      this._senders = this._senders || [];
      origAddStream.apply(this, [stream]);
      stream.getTracks().forEach((track) => {
        this._senders.push(shimSenderWithDtmf(this, track));
      });
    };
    const origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
    window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      this._senders = this._senders || [];
      origRemoveStream.apply(this, [stream]);
      stream.getTracks().forEach((track) => {
        const sender = this._senders.find((s) => s.track === track);
        if (sender) {
          this._senders.splice(this._senders.indexOf(sender), 1);
        }
      });
    };
  } else if (typeof window2 === "object" && window2.RTCPeerConnection && "getSenders" in window2.RTCPeerConnection.prototype && "createDTMFSender" in window2.RTCPeerConnection.prototype && window2.RTCRtpSender && !("dtmf" in window2.RTCRtpSender.prototype)) {
    const origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
    window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
      const senders = origGetSenders.apply(this, []);
      senders.forEach((sender) => sender._pc = this);
      return senders;
    };
    Object.defineProperty(window2.RTCRtpSender.prototype, "dtmf", {
      get() {
        if (this._dtmf === void 0) {
          if (this.track.kind === "audio") {
            this._dtmf = this._pc.createDTMFSender(this.track);
          } else {
            this._dtmf = null;
          }
        }
        return this._dtmf;
      }
    });
  }
}
function shimSenderReceiverGetStats(window2) {
  if (!(typeof window2 === "object" && window2.RTCPeerConnection && window2.RTCRtpSender && window2.RTCRtpReceiver)) {
    return;
  }
  if (!("getStats" in window2.RTCRtpSender.prototype)) {
    const origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
    if (origGetSenders) {
      window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
        const senders = origGetSenders.apply(this, []);
        senders.forEach((sender) => sender._pc = this);
        return senders;
      };
    }
    const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
    if (origAddTrack) {
      window2.RTCPeerConnection.prototype.addTrack = function addTrack() {
        const sender = origAddTrack.apply(this, arguments);
        sender._pc = this;
        return sender;
      };
    }
    window2.RTCRtpSender.prototype.getStats = function getStats() {
      const sender = this;
      return this._pc.getStats().then((result) => (
        /* Note: this will include stats of all senders that
         *   send a track with the same id as sender.track as
         *   it is not possible to identify the RTCRtpSender.
         */
        filterStats(result, sender.track, true)
      ));
    };
  }
  if (!("getStats" in window2.RTCRtpReceiver.prototype)) {
    const origGetReceivers = window2.RTCPeerConnection.prototype.getReceivers;
    if (origGetReceivers) {
      window2.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
        const receivers = origGetReceivers.apply(this, []);
        receivers.forEach((receiver) => receiver._pc = this);
        return receivers;
      };
    }
    wrapPeerConnectionEvent(window2, "track", (e) => {
      e.receiver._pc = e.srcElement;
      return e;
    });
    window2.RTCRtpReceiver.prototype.getStats = function getStats() {
      const receiver = this;
      return this._pc.getStats().then((result) => filterStats(result, receiver.track, false));
    };
  }
  if (!("getStats" in window2.RTCRtpSender.prototype && "getStats" in window2.RTCRtpReceiver.prototype)) {
    return;
  }
  const origGetStats = window2.RTCPeerConnection.prototype.getStats;
  window2.RTCPeerConnection.prototype.getStats = function getStats() {
    if (arguments.length > 0 && arguments[0] instanceof window2.MediaStreamTrack) {
      const track = arguments[0];
      let sender;
      let receiver;
      let err;
      this.getSenders().forEach((s) => {
        if (s.track === track) {
          if (sender) {
            err = true;
          } else {
            sender = s;
          }
        }
      });
      this.getReceivers().forEach((r) => {
        if (r.track === track) {
          if (receiver) {
            err = true;
          } else {
            receiver = r;
          }
        }
        return r.track === track;
      });
      if (err || sender && receiver) {
        return Promise.reject(new DOMException(
          "There are more than one sender or receiver for the track.",
          "InvalidAccessError"
        ));
      } else if (sender) {
        return sender.getStats();
      } else if (receiver) {
        return receiver.getStats();
      }
      return Promise.reject(new DOMException(
        "There is no sender or receiver for the track.",
        "InvalidAccessError"
      ));
    }
    return origGetStats.apply(this, arguments);
  };
}
function shimAddTrackRemoveTrackWithNative(window2) {
  window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    return Object.keys(this._shimmedLocalStreams).map((streamId) => this._shimmedLocalStreams[streamId][0]);
  };
  const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
  window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
    if (!stream) {
      return origAddTrack.apply(this, arguments);
    }
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    const sender = origAddTrack.apply(this, arguments);
    if (!this._shimmedLocalStreams[stream.id]) {
      this._shimmedLocalStreams[stream.id] = [stream, sender];
    } else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) {
      this._shimmedLocalStreams[stream.id].push(sender);
    }
    return sender;
  };
  const origAddStream = window2.RTCPeerConnection.prototype.addStream;
  window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    stream.getTracks().forEach((track) => {
      const alreadyExists = this.getSenders().find((s) => s.track === track);
      if (alreadyExists) {
        throw new DOMException(
          "Track already exists.",
          "InvalidAccessError"
        );
      }
    });
    const existingSenders = this.getSenders();
    origAddStream.apply(this, arguments);
    const newSenders = this.getSenders().filter((newSender) => existingSenders.indexOf(newSender) === -1);
    this._shimmedLocalStreams[stream.id] = [stream].concat(newSenders);
  };
  const origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
  window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    delete this._shimmedLocalStreams[stream.id];
    return origRemoveStream.apply(this, arguments);
  };
  const origRemoveTrack = window2.RTCPeerConnection.prototype.removeTrack;
  window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    if (sender) {
      Object.keys(this._shimmedLocalStreams).forEach((streamId) => {
        const idx = this._shimmedLocalStreams[streamId].indexOf(sender);
        if (idx !== -1) {
          this._shimmedLocalStreams[streamId].splice(idx, 1);
        }
        if (this._shimmedLocalStreams[streamId].length === 1) {
          delete this._shimmedLocalStreams[streamId];
        }
      });
    }
    return origRemoveTrack.apply(this, arguments);
  };
}
function shimAddTrackRemoveTrack(window2, browserDetails) {
  if (!window2.RTCPeerConnection) {
    return;
  }
  if (window2.RTCPeerConnection.prototype.addTrack && browserDetails.version >= 65) {
    return shimAddTrackRemoveTrackWithNative(window2);
  }
  const origGetLocalStreams = window2.RTCPeerConnection.prototype.getLocalStreams;
  window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
    const nativeStreams = origGetLocalStreams.apply(this);
    this._reverseStreams = this._reverseStreams || {};
    return nativeStreams.map((stream) => this._reverseStreams[stream.id]);
  };
  const origAddStream = window2.RTCPeerConnection.prototype.addStream;
  window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};
    stream.getTracks().forEach((track) => {
      const alreadyExists = this.getSenders().find((s) => s.track === track);
      if (alreadyExists) {
        throw new DOMException(
          "Track already exists.",
          "InvalidAccessError"
        );
      }
    });
    if (!this._reverseStreams[stream.id]) {
      const newStream = new window2.MediaStream(stream.getTracks());
      this._streams[stream.id] = newStream;
      this._reverseStreams[newStream.id] = stream;
      stream = newStream;
    }
    origAddStream.apply(this, [stream]);
  };
  const origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
  window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};
    origRemoveStream.apply(this, [this._streams[stream.id] || stream]);
    delete this._reverseStreams[this._streams[stream.id] ? this._streams[stream.id].id : stream.id];
    delete this._streams[stream.id];
  };
  window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
    if (this.signalingState === "closed") {
      throw new DOMException(
        "The RTCPeerConnection's signalingState is 'closed'.",
        "InvalidStateError"
      );
    }
    const streams = [].slice.call(arguments, 1);
    if (streams.length !== 1 || !streams[0].getTracks().find((t) => t === track)) {
      throw new DOMException(
        "The adapter.js addTrack polyfill only supports a single  stream which is associated with the specified track.",
        "NotSupportedError"
      );
    }
    const alreadyExists = this.getSenders().find((s) => s.track === track);
    if (alreadyExists) {
      throw new DOMException(
        "Track already exists.",
        "InvalidAccessError"
      );
    }
    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};
    const oldStream = this._streams[stream.id];
    if (oldStream) {
      oldStream.addTrack(track);
      Promise.resolve().then(() => {
        this.dispatchEvent(new Event("negotiationneeded"));
      });
    } else {
      const newStream = new window2.MediaStream([track]);
      this._streams[stream.id] = newStream;
      this._reverseStreams[newStream.id] = stream;
      this.addStream(newStream);
    }
    return this.getSenders().find((s) => s.track === track);
  };
  function replaceInternalStreamId(pc, description) {
    let sdp2 = description.sdp;
    Object.keys(pc._reverseStreams || []).forEach((internalId) => {
      const externalStream = pc._reverseStreams[internalId];
      const internalStream = pc._streams[externalStream.id];
      sdp2 = sdp2.replace(
        new RegExp(internalStream.id, "g"),
        externalStream.id
      );
    });
    return new RTCSessionDescription({
      type: description.type,
      sdp: sdp2
    });
  }
  function replaceExternalStreamId(pc, description) {
    let sdp2 = description.sdp;
    Object.keys(pc._reverseStreams || []).forEach((internalId) => {
      const externalStream = pc._reverseStreams[internalId];
      const internalStream = pc._streams[externalStream.id];
      sdp2 = sdp2.replace(
        new RegExp(externalStream.id, "g"),
        internalStream.id
      );
    });
    return new RTCSessionDescription({
      type: description.type,
      sdp: sdp2
    });
  }
  ["createOffer", "createAnswer"].forEach(function(method) {
    const nativeMethod = window2.RTCPeerConnection.prototype[method];
    const methodObj = { [method]() {
      const args = arguments;
      const isLegacyCall = arguments.length && typeof arguments[0] === "function";
      if (isLegacyCall) {
        return nativeMethod.apply(this, [
          (description) => {
            const desc = replaceInternalStreamId(this, description);
            args[0].apply(null, [desc]);
          },
          (err) => {
            if (args[1]) {
              args[1].apply(null, err);
            }
          },
          arguments[2]
        ]);
      }
      return nativeMethod.apply(this, arguments).then((description) => replaceInternalStreamId(this, description));
    } };
    window2.RTCPeerConnection.prototype[method] = methodObj[method];
  });
  const origSetLocalDescription = window2.RTCPeerConnection.prototype.setLocalDescription;
  window2.RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription() {
    if (!arguments.length || !arguments[0].type) {
      return origSetLocalDescription.apply(this, arguments);
    }
    arguments[0] = replaceExternalStreamId(this, arguments[0]);
    return origSetLocalDescription.apply(this, arguments);
  };
  const origLocalDescription = Object.getOwnPropertyDescriptor(
    window2.RTCPeerConnection.prototype,
    "localDescription"
  );
  Object.defineProperty(
    window2.RTCPeerConnection.prototype,
    "localDescription",
    {
      get() {
        const description = origLocalDescription.get.apply(this);
        if (description.type === "") {
          return description;
        }
        return replaceInternalStreamId(this, description);
      }
    }
  );
  window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
    if (this.signalingState === "closed") {
      throw new DOMException(
        "The RTCPeerConnection's signalingState is 'closed'.",
        "InvalidStateError"
      );
    }
    if (!sender._pc) {
      throw new DOMException("Argument 1 of RTCPeerConnection.removeTrack does not implement interface RTCRtpSender.", "TypeError");
    }
    const isLocal = sender._pc === this;
    if (!isLocal) {
      throw new DOMException(
        "Sender was not created by this connection.",
        "InvalidAccessError"
      );
    }
    this._streams = this._streams || {};
    let stream;
    Object.keys(this._streams).forEach((streamid) => {
      const hasTrack = this._streams[streamid].getTracks().find((track) => sender.track === track);
      if (hasTrack) {
        stream = this._streams[streamid];
      }
    });
    if (stream) {
      if (stream.getTracks().length === 1) {
        this.removeStream(this._reverseStreams[stream.id]);
      } else {
        stream.removeTrack(sender.track);
      }
      this.dispatchEvent(new Event("negotiationneeded"));
    }
  };
}
function shimPeerConnection(window2, browserDetails) {
  if (!window2.RTCPeerConnection && window2.webkitRTCPeerConnection) {
    window2.RTCPeerConnection = window2.webkitRTCPeerConnection;
  }
  if (!window2.RTCPeerConnection) {
    return;
  }
  if (browserDetails.version < 53) {
    ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function(method) {
      const nativeMethod = window2.RTCPeerConnection.prototype[method];
      const methodObj = { [method]() {
        arguments[0] = new (method === "addIceCandidate" ? window2.RTCIceCandidate : window2.RTCSessionDescription)(arguments[0]);
        return nativeMethod.apply(this, arguments);
      } };
      window2.RTCPeerConnection.prototype[method] = methodObj[method];
    });
  }
}
function fixNegotiationNeeded(window2, browserDetails) {
  wrapPeerConnectionEvent(window2, "negotiationneeded", (e) => {
    const pc = e.target;
    if (browserDetails.version < 72 || pc.getConfiguration && pc.getConfiguration().sdpSemantics === "plan-b") {
      if (pc.signalingState !== "stable") {
        return;
      }
    }
    return e;
  });
}

// node_modules/webrtc-adapter/src/js/firefox/firefox_shim.js
var firefox_shim_exports = {};
__export(firefox_shim_exports, {
  shimAddTransceiver: () => shimAddTransceiver,
  shimCreateAnswer: () => shimCreateAnswer,
  shimCreateOffer: () => shimCreateOffer,
  shimGetDisplayMedia: () => shimGetDisplayMedia,
  shimGetParameters: () => shimGetParameters,
  shimGetUserMedia: () => shimGetUserMedia2,
  shimOnTrack: () => shimOnTrack2,
  shimPeerConnection: () => shimPeerConnection2,
  shimRTCDataChannel: () => shimRTCDataChannel,
  shimReceiverGetStats: () => shimReceiverGetStats,
  shimRemoveStream: () => shimRemoveStream,
  shimSenderGetStats: () => shimSenderGetStats
});

// node_modules/webrtc-adapter/src/js/firefox/getusermedia.js
function shimGetUserMedia2(window2, browserDetails) {
  const navigator2 = window2 && window2.navigator;
  const MediaStreamTrack = window2 && window2.MediaStreamTrack;
  navigator2.getUserMedia = function(constraints, onSuccess, onError) {
    deprecated(
      "navigator.getUserMedia",
      "navigator.mediaDevices.getUserMedia"
    );
    navigator2.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  };
  if (!(browserDetails.version > 55 && "autoGainControl" in navigator2.mediaDevices.getSupportedConstraints())) {
    const remap = function(obj, a, b2) {
      if (a in obj && !(b2 in obj)) {
        obj[b2] = obj[a];
        delete obj[a];
      }
    };
    const nativeGetUserMedia = navigator2.mediaDevices.getUserMedia.bind(navigator2.mediaDevices);
    navigator2.mediaDevices.getUserMedia = function(c) {
      if (typeof c === "object" && typeof c.audio === "object") {
        c = JSON.parse(JSON.stringify(c));
        remap(c.audio, "autoGainControl", "mozAutoGainControl");
        remap(c.audio, "noiseSuppression", "mozNoiseSuppression");
      }
      return nativeGetUserMedia(c);
    };
    if (MediaStreamTrack && MediaStreamTrack.prototype.getSettings) {
      const nativeGetSettings = MediaStreamTrack.prototype.getSettings;
      MediaStreamTrack.prototype.getSettings = function() {
        const obj = nativeGetSettings.apply(this, arguments);
        remap(obj, "mozAutoGainControl", "autoGainControl");
        remap(obj, "mozNoiseSuppression", "noiseSuppression");
        return obj;
      };
    }
    if (MediaStreamTrack && MediaStreamTrack.prototype.applyConstraints) {
      const nativeApplyConstraints = MediaStreamTrack.prototype.applyConstraints;
      MediaStreamTrack.prototype.applyConstraints = function(c) {
        if (this.kind === "audio" && typeof c === "object") {
          c = JSON.parse(JSON.stringify(c));
          remap(c, "autoGainControl", "mozAutoGainControl");
          remap(c, "noiseSuppression", "mozNoiseSuppression");
        }
        return nativeApplyConstraints.apply(this, [c]);
      };
    }
  }
}

// node_modules/webrtc-adapter/src/js/firefox/getdisplaymedia.js
function shimGetDisplayMedia(window2, preferredMediaSource) {
  if (window2.navigator.mediaDevices && "getDisplayMedia" in window2.navigator.mediaDevices) {
    return;
  }
  if (!window2.navigator.mediaDevices) {
    return;
  }
  window2.navigator.mediaDevices.getDisplayMedia = function getDisplayMedia(constraints) {
    if (!(constraints && constraints.video)) {
      const err = new DOMException("getDisplayMedia without video constraints is undefined");
      err.name = "NotFoundError";
      err.code = 8;
      return Promise.reject(err);
    }
    if (constraints.video === true) {
      constraints.video = { mediaSource: preferredMediaSource };
    } else {
      constraints.video.mediaSource = preferredMediaSource;
    }
    return window2.navigator.mediaDevices.getUserMedia(constraints);
  };
}

// node_modules/webrtc-adapter/src/js/firefox/firefox_shim.js
function shimOnTrack2(window2) {
  if (typeof window2 === "object" && window2.RTCTrackEvent && "receiver" in window2.RTCTrackEvent.prototype && !("transceiver" in window2.RTCTrackEvent.prototype)) {
    Object.defineProperty(window2.RTCTrackEvent.prototype, "transceiver", {
      get() {
        return { receiver: this.receiver };
      }
    });
  }
}
function shimPeerConnection2(window2, browserDetails) {
  if (typeof window2 !== "object" || !(window2.RTCPeerConnection || window2.mozRTCPeerConnection)) {
    return;
  }
  if (!window2.RTCPeerConnection && window2.mozRTCPeerConnection) {
    window2.RTCPeerConnection = window2.mozRTCPeerConnection;
  }
  if (browserDetails.version < 53) {
    ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function(method) {
      const nativeMethod = window2.RTCPeerConnection.prototype[method];
      const methodObj = { [method]() {
        arguments[0] = new (method === "addIceCandidate" ? window2.RTCIceCandidate : window2.RTCSessionDescription)(arguments[0]);
        return nativeMethod.apply(this, arguments);
      } };
      window2.RTCPeerConnection.prototype[method] = methodObj[method];
    });
  }
  const modernStatsTypes = {
    inboundrtp: "inbound-rtp",
    outboundrtp: "outbound-rtp",
    candidatepair: "candidate-pair",
    localcandidate: "local-candidate",
    remotecandidate: "remote-candidate"
  };
  const nativeGetStats = window2.RTCPeerConnection.prototype.getStats;
  window2.RTCPeerConnection.prototype.getStats = function getStats() {
    const [selector, onSucc, onErr] = arguments;
    return nativeGetStats.apply(this, [selector || null]).then((stats) => {
      if (browserDetails.version < 53 && !onSucc) {
        try {
          stats.forEach((stat) => {
            stat.type = modernStatsTypes[stat.type] || stat.type;
          });
        } catch (e) {
          if (e.name !== "TypeError") {
            throw e;
          }
          stats.forEach((stat, i2) => {
            stats.set(i2, Object.assign({}, stat, {
              type: modernStatsTypes[stat.type] || stat.type
            }));
          });
        }
      }
      return stats;
    }).then(onSucc, onErr);
  };
}
function shimSenderGetStats(window2) {
  if (!(typeof window2 === "object" && window2.RTCPeerConnection && window2.RTCRtpSender)) {
    return;
  }
  if (window2.RTCRtpSender && "getStats" in window2.RTCRtpSender.prototype) {
    return;
  }
  const origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
  if (origGetSenders) {
    window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
      const senders = origGetSenders.apply(this, []);
      senders.forEach((sender) => sender._pc = this);
      return senders;
    };
  }
  const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
  if (origAddTrack) {
    window2.RTCPeerConnection.prototype.addTrack = function addTrack() {
      const sender = origAddTrack.apply(this, arguments);
      sender._pc = this;
      return sender;
    };
  }
  window2.RTCRtpSender.prototype.getStats = function getStats() {
    return this.track ? this._pc.getStats(this.track) : Promise.resolve(/* @__PURE__ */ new Map());
  };
}
function shimReceiverGetStats(window2) {
  if (!(typeof window2 === "object" && window2.RTCPeerConnection && window2.RTCRtpSender)) {
    return;
  }
  if (window2.RTCRtpSender && "getStats" in window2.RTCRtpReceiver.prototype) {
    return;
  }
  const origGetReceivers = window2.RTCPeerConnection.prototype.getReceivers;
  if (origGetReceivers) {
    window2.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
      const receivers = origGetReceivers.apply(this, []);
      receivers.forEach((receiver) => receiver._pc = this);
      return receivers;
    };
  }
  wrapPeerConnectionEvent(window2, "track", (e) => {
    e.receiver._pc = e.srcElement;
    return e;
  });
  window2.RTCRtpReceiver.prototype.getStats = function getStats() {
    return this._pc.getStats(this.track);
  };
}
function shimRemoveStream(window2) {
  if (!window2.RTCPeerConnection || "removeStream" in window2.RTCPeerConnection.prototype) {
    return;
  }
  window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
    deprecated("removeStream", "removeTrack");
    this.getSenders().forEach((sender) => {
      if (sender.track && stream.getTracks().includes(sender.track)) {
        this.removeTrack(sender);
      }
    });
  };
}
function shimRTCDataChannel(window2) {
  if (window2.DataChannel && !window2.RTCDataChannel) {
    window2.RTCDataChannel = window2.DataChannel;
  }
}
function shimAddTransceiver(window2) {
  if (!(typeof window2 === "object" && window2.RTCPeerConnection)) {
    return;
  }
  const origAddTransceiver = window2.RTCPeerConnection.prototype.addTransceiver;
  if (origAddTransceiver) {
    window2.RTCPeerConnection.prototype.addTransceiver = function addTransceiver() {
      this.setParametersPromises = [];
      let sendEncodings = arguments[1] && arguments[1].sendEncodings;
      if (sendEncodings === void 0) {
        sendEncodings = [];
      }
      sendEncodings = [...sendEncodings];
      const shouldPerformCheck = sendEncodings.length > 0;
      if (shouldPerformCheck) {
        sendEncodings.forEach((encodingParam) => {
          if ("rid" in encodingParam) {
            const ridRegex = /^[a-z0-9]{0,16}$/i;
            if (!ridRegex.test(encodingParam.rid)) {
              throw new TypeError("Invalid RID value provided.");
            }
          }
          if ("scaleResolutionDownBy" in encodingParam) {
            if (!(parseFloat(encodingParam.scaleResolutionDownBy) >= 1)) {
              throw new RangeError("scale_resolution_down_by must be >= 1.0");
            }
          }
          if ("maxFramerate" in encodingParam) {
            if (!(parseFloat(encodingParam.maxFramerate) >= 0)) {
              throw new RangeError("max_framerate must be >= 0.0");
            }
          }
        });
      }
      const transceiver = origAddTransceiver.apply(this, arguments);
      if (shouldPerformCheck) {
        const { sender } = transceiver;
        const params = sender.getParameters();
        if (!("encodings" in params) || // Avoid being fooled by patched getParameters() below.
        params.encodings.length === 1 && Object.keys(params.encodings[0]).length === 0) {
          params.encodings = sendEncodings;
          sender.sendEncodings = sendEncodings;
          this.setParametersPromises.push(
            sender.setParameters(params).then(() => {
              delete sender.sendEncodings;
            }).catch(() => {
              delete sender.sendEncodings;
            })
          );
        }
      }
      return transceiver;
    };
  }
}
function shimGetParameters(window2) {
  if (!(typeof window2 === "object" && window2.RTCRtpSender)) {
    return;
  }
  const origGetParameters = window2.RTCRtpSender.prototype.getParameters;
  if (origGetParameters) {
    window2.RTCRtpSender.prototype.getParameters = function getParameters() {
      const params = origGetParameters.apply(this, arguments);
      if (!("encodings" in params)) {
        params.encodings = [].concat(this.sendEncodings || [{}]);
      }
      return params;
    };
  }
}
function shimCreateOffer(window2) {
  if (!(typeof window2 === "object" && window2.RTCPeerConnection)) {
    return;
  }
  const origCreateOffer = window2.RTCPeerConnection.prototype.createOffer;
  window2.RTCPeerConnection.prototype.createOffer = function createOffer() {
    if (this.setParametersPromises && this.setParametersPromises.length) {
      return Promise.all(this.setParametersPromises).then(() => {
        return origCreateOffer.apply(this, arguments);
      }).finally(() => {
        this.setParametersPromises = [];
      });
    }
    return origCreateOffer.apply(this, arguments);
  };
}
function shimCreateAnswer(window2) {
  if (!(typeof window2 === "object" && window2.RTCPeerConnection)) {
    return;
  }
  const origCreateAnswer = window2.RTCPeerConnection.prototype.createAnswer;
  window2.RTCPeerConnection.prototype.createAnswer = function createAnswer() {
    if (this.setParametersPromises && this.setParametersPromises.length) {
      return Promise.all(this.setParametersPromises).then(() => {
        return origCreateAnswer.apply(this, arguments);
      }).finally(() => {
        this.setParametersPromises = [];
      });
    }
    return origCreateAnswer.apply(this, arguments);
  };
}

// node_modules/webrtc-adapter/src/js/safari/safari_shim.js
var safari_shim_exports = {};
__export(safari_shim_exports, {
  shimAudioContext: () => shimAudioContext,
  shimCallbacksAPI: () => shimCallbacksAPI,
  shimConstraints: () => shimConstraints,
  shimCreateOfferLegacy: () => shimCreateOfferLegacy,
  shimGetUserMedia: () => shimGetUserMedia3,
  shimLocalStreamsAPI: () => shimLocalStreamsAPI,
  shimRTCIceServerUrls: () => shimRTCIceServerUrls,
  shimRemoteStreamsAPI: () => shimRemoteStreamsAPI,
  shimTrackEventTransceiver: () => shimTrackEventTransceiver
});
function shimLocalStreamsAPI(window2) {
  if (typeof window2 !== "object" || !window2.RTCPeerConnection) {
    return;
  }
  if (!("getLocalStreams" in window2.RTCPeerConnection.prototype)) {
    window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
      if (!this._localStreams) {
        this._localStreams = [];
      }
      return this._localStreams;
    };
  }
  if (!("addStream" in window2.RTCPeerConnection.prototype)) {
    const _addTrack = window2.RTCPeerConnection.prototype.addTrack;
    window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      if (!this._localStreams) {
        this._localStreams = [];
      }
      if (!this._localStreams.includes(stream)) {
        this._localStreams.push(stream);
      }
      stream.getAudioTracks().forEach((track) => _addTrack.call(
        this,
        track,
        stream
      ));
      stream.getVideoTracks().forEach((track) => _addTrack.call(
        this,
        track,
        stream
      ));
    };
    window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, ...streams) {
      if (streams) {
        streams.forEach((stream) => {
          if (!this._localStreams) {
            this._localStreams = [stream];
          } else if (!this._localStreams.includes(stream)) {
            this._localStreams.push(stream);
          }
        });
      }
      return _addTrack.apply(this, arguments);
    };
  }
  if (!("removeStream" in window2.RTCPeerConnection.prototype)) {
    window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      if (!this._localStreams) {
        this._localStreams = [];
      }
      const index = this._localStreams.indexOf(stream);
      if (index === -1) {
        return;
      }
      this._localStreams.splice(index, 1);
      const tracks = stream.getTracks();
      this.getSenders().forEach((sender) => {
        if (tracks.includes(sender.track)) {
          this.removeTrack(sender);
        }
      });
    };
  }
}
function shimRemoteStreamsAPI(window2) {
  if (typeof window2 !== "object" || !window2.RTCPeerConnection) {
    return;
  }
  if (!("getRemoteStreams" in window2.RTCPeerConnection.prototype)) {
    window2.RTCPeerConnection.prototype.getRemoteStreams = function getRemoteStreams() {
      return this._remoteStreams ? this._remoteStreams : [];
    };
  }
  if (!("onaddstream" in window2.RTCPeerConnection.prototype)) {
    Object.defineProperty(window2.RTCPeerConnection.prototype, "onaddstream", {
      get() {
        return this._onaddstream;
      },
      set(f) {
        if (this._onaddstream) {
          this.removeEventListener("addstream", this._onaddstream);
          this.removeEventListener("track", this._onaddstreampoly);
        }
        this.addEventListener("addstream", this._onaddstream = f);
        this.addEventListener("track", this._onaddstreampoly = (e) => {
          e.streams.forEach((stream) => {
            if (!this._remoteStreams) {
              this._remoteStreams = [];
            }
            if (this._remoteStreams.includes(stream)) {
              return;
            }
            this._remoteStreams.push(stream);
            const event = new Event("addstream");
            event.stream = stream;
            this.dispatchEvent(event);
          });
        });
      }
    });
    const origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
    window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
      const pc = this;
      if (!this._onaddstreampoly) {
        this.addEventListener("track", this._onaddstreampoly = function(e) {
          e.streams.forEach((stream) => {
            if (!pc._remoteStreams) {
              pc._remoteStreams = [];
            }
            if (pc._remoteStreams.indexOf(stream) >= 0) {
              return;
            }
            pc._remoteStreams.push(stream);
            const event = new Event("addstream");
            event.stream = stream;
            pc.dispatchEvent(event);
          });
        });
      }
      return origSetRemoteDescription.apply(pc, arguments);
    };
  }
}
function shimCallbacksAPI(window2) {
  if (typeof window2 !== "object" || !window2.RTCPeerConnection) {
    return;
  }
  const prototype = window2.RTCPeerConnection.prototype;
  const origCreateOffer = prototype.createOffer;
  const origCreateAnswer = prototype.createAnswer;
  const setLocalDescription = prototype.setLocalDescription;
  const setRemoteDescription = prototype.setRemoteDescription;
  const addIceCandidate = prototype.addIceCandidate;
  prototype.createOffer = function createOffer(successCallback, failureCallback) {
    const options = arguments.length >= 2 ? arguments[2] : arguments[0];
    const promise = origCreateOffer.apply(this, [options]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.createAnswer = function createAnswer(successCallback, failureCallback) {
    const options = arguments.length >= 2 ? arguments[2] : arguments[0];
    const promise = origCreateAnswer.apply(this, [options]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  let withCallback = function(description, successCallback, failureCallback) {
    const promise = setLocalDescription.apply(this, [description]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.setLocalDescription = withCallback;
  withCallback = function(description, successCallback, failureCallback) {
    const promise = setRemoteDescription.apply(this, [description]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.setRemoteDescription = withCallback;
  withCallback = function(candidate, successCallback, failureCallback) {
    const promise = addIceCandidate.apply(this, [candidate]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.addIceCandidate = withCallback;
}
function shimGetUserMedia3(window2) {
  const navigator2 = window2 && window2.navigator;
  if (navigator2.mediaDevices && navigator2.mediaDevices.getUserMedia) {
    const mediaDevices = navigator2.mediaDevices;
    const _getUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
    navigator2.mediaDevices.getUserMedia = (constraints) => {
      return _getUserMedia(shimConstraints(constraints));
    };
  }
  if (!navigator2.getUserMedia && navigator2.mediaDevices && navigator2.mediaDevices.getUserMedia) {
    navigator2.getUserMedia = function getUserMedia(constraints, cb, errcb) {
      navigator2.mediaDevices.getUserMedia(constraints).then(cb, errcb);
    }.bind(navigator2);
  }
}
function shimConstraints(constraints) {
  if (constraints && constraints.video !== void 0) {
    return Object.assign(
      {},
      constraints,
      { video: compactObject(constraints.video) }
    );
  }
  return constraints;
}
function shimRTCIceServerUrls(window2) {
  if (!window2.RTCPeerConnection) {
    return;
  }
  const OrigPeerConnection = window2.RTCPeerConnection;
  window2.RTCPeerConnection = function RTCPeerConnection2(pcConfig, pcConstraints) {
    if (pcConfig && pcConfig.iceServers) {
      const newIceServers = [];
      for (let i2 = 0; i2 < pcConfig.iceServers.length; i2++) {
        let server = pcConfig.iceServers[i2];
        if (server.urls === void 0 && server.url) {
          deprecated("RTCIceServer.url", "RTCIceServer.urls");
          server = JSON.parse(JSON.stringify(server));
          server.urls = server.url;
          delete server.url;
          newIceServers.push(server);
        } else {
          newIceServers.push(pcConfig.iceServers[i2]);
        }
      }
      pcConfig.iceServers = newIceServers;
    }
    return new OrigPeerConnection(pcConfig, pcConstraints);
  };
  window2.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
  if ("generateCertificate" in OrigPeerConnection) {
    Object.defineProperty(window2.RTCPeerConnection, "generateCertificate", {
      get() {
        return OrigPeerConnection.generateCertificate;
      }
    });
  }
}
function shimTrackEventTransceiver(window2) {
  if (typeof window2 === "object" && window2.RTCTrackEvent && "receiver" in window2.RTCTrackEvent.prototype && !("transceiver" in window2.RTCTrackEvent.prototype)) {
    Object.defineProperty(window2.RTCTrackEvent.prototype, "transceiver", {
      get() {
        return { receiver: this.receiver };
      }
    });
  }
}
function shimCreateOfferLegacy(window2) {
  const origCreateOffer = window2.RTCPeerConnection.prototype.createOffer;
  window2.RTCPeerConnection.prototype.createOffer = function createOffer(offerOptions) {
    if (offerOptions) {
      if (typeof offerOptions.offerToReceiveAudio !== "undefined") {
        offerOptions.offerToReceiveAudio = !!offerOptions.offerToReceiveAudio;
      }
      const audioTransceiver = this.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === "audio");
      if (offerOptions.offerToReceiveAudio === false && audioTransceiver) {
        if (audioTransceiver.direction === "sendrecv") {
          if (audioTransceiver.setDirection) {
            audioTransceiver.setDirection("sendonly");
          } else {
            audioTransceiver.direction = "sendonly";
          }
        } else if (audioTransceiver.direction === "recvonly") {
          if (audioTransceiver.setDirection) {
            audioTransceiver.setDirection("inactive");
          } else {
            audioTransceiver.direction = "inactive";
          }
        }
      } else if (offerOptions.offerToReceiveAudio === true && !audioTransceiver) {
        this.addTransceiver("audio", { direction: "recvonly" });
      }
      if (typeof offerOptions.offerToReceiveVideo !== "undefined") {
        offerOptions.offerToReceiveVideo = !!offerOptions.offerToReceiveVideo;
      }
      const videoTransceiver = this.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === "video");
      if (offerOptions.offerToReceiveVideo === false && videoTransceiver) {
        if (videoTransceiver.direction === "sendrecv") {
          if (videoTransceiver.setDirection) {
            videoTransceiver.setDirection("sendonly");
          } else {
            videoTransceiver.direction = "sendonly";
          }
        } else if (videoTransceiver.direction === "recvonly") {
          if (videoTransceiver.setDirection) {
            videoTransceiver.setDirection("inactive");
          } else {
            videoTransceiver.direction = "inactive";
          }
        }
      } else if (offerOptions.offerToReceiveVideo === true && !videoTransceiver) {
        this.addTransceiver("video", { direction: "recvonly" });
      }
    }
    return origCreateOffer.apply(this, arguments);
  };
}
function shimAudioContext(window2) {
  if (typeof window2 !== "object" || window2.AudioContext) {
    return;
  }
  window2.AudioContext = window2.webkitAudioContext;
}

// node_modules/webrtc-adapter/src/js/common_shim.js
var common_shim_exports = {};
__export(common_shim_exports, {
  removeExtmapAllowMixed: () => removeExtmapAllowMixed,
  shimAddIceCandidateNullOrEmpty: () => shimAddIceCandidateNullOrEmpty,
  shimConnectionState: () => shimConnectionState,
  shimMaxMessageSize: () => shimMaxMessageSize,
  shimParameterlessSetLocalDescription: () => shimParameterlessSetLocalDescription,
  shimRTCIceCandidate: () => shimRTCIceCandidate,
  shimRTCIceCandidateRelayProtocol: () => shimRTCIceCandidateRelayProtocol,
  shimSendThrowTypeError: () => shimSendThrowTypeError
});
var import_sdp = __toESM(require_sdp());
function shimRTCIceCandidate(window2) {
  if (!window2.RTCIceCandidate || window2.RTCIceCandidate && "foundation" in window2.RTCIceCandidate.prototype) {
    return;
  }
  const NativeRTCIceCandidate = window2.RTCIceCandidate;
  window2.RTCIceCandidate = function RTCIceCandidate(args) {
    if (typeof args === "object" && args.candidate && args.candidate.indexOf("a=") === 0) {
      args = JSON.parse(JSON.stringify(args));
      args.candidate = args.candidate.substring(2);
    }
    if (args.candidate && args.candidate.length) {
      const nativeCandidate = new NativeRTCIceCandidate(args);
      const parsedCandidate = import_sdp.default.parseCandidate(args.candidate);
      for (const key in parsedCandidate) {
        if (!(key in nativeCandidate)) {
          Object.defineProperty(
            nativeCandidate,
            key,
            { value: parsedCandidate[key] }
          );
        }
      }
      nativeCandidate.toJSON = function toJSON() {
        return {
          candidate: nativeCandidate.candidate,
          sdpMid: nativeCandidate.sdpMid,
          sdpMLineIndex: nativeCandidate.sdpMLineIndex,
          usernameFragment: nativeCandidate.usernameFragment
        };
      };
      return nativeCandidate;
    }
    return new NativeRTCIceCandidate(args);
  };
  window2.RTCIceCandidate.prototype = NativeRTCIceCandidate.prototype;
  wrapPeerConnectionEvent(window2, "icecandidate", (e) => {
    if (e.candidate) {
      Object.defineProperty(e, "candidate", {
        value: new window2.RTCIceCandidate(e.candidate),
        writable: "false"
      });
    }
    return e;
  });
}
function shimRTCIceCandidateRelayProtocol(window2) {
  if (!window2.RTCIceCandidate || window2.RTCIceCandidate && "relayProtocol" in window2.RTCIceCandidate.prototype) {
    return;
  }
  wrapPeerConnectionEvent(window2, "icecandidate", (e) => {
    if (e.candidate) {
      const parsedCandidate = import_sdp.default.parseCandidate(e.candidate.candidate);
      if (parsedCandidate.type === "relay") {
        e.candidate.relayProtocol = {
          0: "tls",
          1: "tcp",
          2: "udp"
        }[parsedCandidate.priority >> 24];
      }
    }
    return e;
  });
}
function shimMaxMessageSize(window2, browserDetails) {
  if (!window2.RTCPeerConnection) {
    return;
  }
  if (!("sctp" in window2.RTCPeerConnection.prototype)) {
    Object.defineProperty(window2.RTCPeerConnection.prototype, "sctp", {
      get() {
        return typeof this._sctp === "undefined" ? null : this._sctp;
      }
    });
  }
  const sctpInDescription = function(description) {
    if (!description || !description.sdp) {
      return false;
    }
    const sections = import_sdp.default.splitSections(description.sdp);
    sections.shift();
    return sections.some((mediaSection) => {
      const mLine = import_sdp.default.parseMLine(mediaSection);
      return mLine && mLine.kind === "application" && mLine.protocol.indexOf("SCTP") !== -1;
    });
  };
  const getRemoteFirefoxVersion = function(description) {
    const match = description.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);
    if (match === null || match.length < 2) {
      return -1;
    }
    const version = parseInt(match[1], 10);
    return version !== version ? -1 : version;
  };
  const getCanSendMaxMessageSize = function(remoteIsFirefox) {
    let canSendMaxMessageSize = 65536;
    if (browserDetails.browser === "firefox") {
      if (browserDetails.version < 57) {
        if (remoteIsFirefox === -1) {
          canSendMaxMessageSize = 16384;
        } else {
          canSendMaxMessageSize = 2147483637;
        }
      } else if (browserDetails.version < 60) {
        canSendMaxMessageSize = browserDetails.version === 57 ? 65535 : 65536;
      } else {
        canSendMaxMessageSize = 2147483637;
      }
    }
    return canSendMaxMessageSize;
  };
  const getMaxMessageSize = function(description, remoteIsFirefox) {
    let maxMessageSize = 65536;
    if (browserDetails.browser === "firefox" && browserDetails.version === 57) {
      maxMessageSize = 65535;
    }
    const match = import_sdp.default.matchPrefix(
      description.sdp,
      "a=max-message-size:"
    );
    if (match.length > 0) {
      maxMessageSize = parseInt(match[0].substring(19), 10);
    } else if (browserDetails.browser === "firefox" && remoteIsFirefox !== -1) {
      maxMessageSize = 2147483637;
    }
    return maxMessageSize;
  };
  const origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
  window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
    this._sctp = null;
    if (browserDetails.browser === "chrome" && browserDetails.version >= 76) {
      const { sdpSemantics } = this.getConfiguration();
      if (sdpSemantics === "plan-b") {
        Object.defineProperty(this, "sctp", {
          get() {
            return typeof this._sctp === "undefined" ? null : this._sctp;
          },
          enumerable: true,
          configurable: true
        });
      }
    }
    if (sctpInDescription(arguments[0])) {
      const isFirefox = getRemoteFirefoxVersion(arguments[0]);
      const canSendMMS = getCanSendMaxMessageSize(isFirefox);
      const remoteMMS = getMaxMessageSize(arguments[0], isFirefox);
      let maxMessageSize;
      if (canSendMMS === 0 && remoteMMS === 0) {
        maxMessageSize = Number.POSITIVE_INFINITY;
      } else if (canSendMMS === 0 || remoteMMS === 0) {
        maxMessageSize = Math.max(canSendMMS, remoteMMS);
      } else {
        maxMessageSize = Math.min(canSendMMS, remoteMMS);
      }
      const sctp = {};
      Object.defineProperty(sctp, "maxMessageSize", {
        get() {
          return maxMessageSize;
        }
      });
      this._sctp = sctp;
    }
    return origSetRemoteDescription.apply(this, arguments);
  };
}
function shimSendThrowTypeError(window2) {
  if (!(window2.RTCPeerConnection && "createDataChannel" in window2.RTCPeerConnection.prototype)) {
    return;
  }
  function wrapDcSend(dc, pc) {
    const origDataChannelSend = dc.send;
    dc.send = function send() {
      const data = arguments[0];
      const length = data.length || data.size || data.byteLength;
      if (dc.readyState === "open" && pc.sctp && length > pc.sctp.maxMessageSize) {
        throw new TypeError("Message too large (can send a maximum of " + pc.sctp.maxMessageSize + " bytes)");
      }
      return origDataChannelSend.apply(dc, arguments);
    };
  }
  const origCreateDataChannel = window2.RTCPeerConnection.prototype.createDataChannel;
  window2.RTCPeerConnection.prototype.createDataChannel = function createDataChannel() {
    const dataChannel = origCreateDataChannel.apply(this, arguments);
    wrapDcSend(dataChannel, this);
    return dataChannel;
  };
  wrapPeerConnectionEvent(window2, "datachannel", (e) => {
    wrapDcSend(e.channel, e.target);
    return e;
  });
}
function shimConnectionState(window2) {
  if (!window2.RTCPeerConnection || "connectionState" in window2.RTCPeerConnection.prototype) {
    return;
  }
  const proto = window2.RTCPeerConnection.prototype;
  Object.defineProperty(proto, "connectionState", {
    get() {
      return {
        completed: "connected",
        checking: "connecting"
      }[this.iceConnectionState] || this.iceConnectionState;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(proto, "onconnectionstatechange", {
    get() {
      return this._onconnectionstatechange || null;
    },
    set(cb) {
      if (this._onconnectionstatechange) {
        this.removeEventListener(
          "connectionstatechange",
          this._onconnectionstatechange
        );
        delete this._onconnectionstatechange;
      }
      if (cb) {
        this.addEventListener(
          "connectionstatechange",
          this._onconnectionstatechange = cb
        );
      }
    },
    enumerable: true,
    configurable: true
  });
  ["setLocalDescription", "setRemoteDescription"].forEach((method) => {
    const origMethod = proto[method];
    proto[method] = function() {
      if (!this._connectionstatechangepoly) {
        this._connectionstatechangepoly = (e) => {
          const pc = e.target;
          if (pc._lastConnectionState !== pc.connectionState) {
            pc._lastConnectionState = pc.connectionState;
            const newEvent = new Event("connectionstatechange", e);
            pc.dispatchEvent(newEvent);
          }
          return e;
        };
        this.addEventListener(
          "iceconnectionstatechange",
          this._connectionstatechangepoly
        );
      }
      return origMethod.apply(this, arguments);
    };
  });
}
function removeExtmapAllowMixed(window2, browserDetails) {
  if (!window2.RTCPeerConnection) {
    return;
  }
  if (browserDetails.browser === "chrome" && browserDetails.version >= 71) {
    return;
  }
  if (browserDetails.browser === "safari" && browserDetails._safariVersion >= 13.1) {
    return;
  }
  const nativeSRD = window2.RTCPeerConnection.prototype.setRemoteDescription;
  window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription(desc) {
    if (desc && desc.sdp && desc.sdp.indexOf("\na=extmap-allow-mixed") !== -1) {
      const sdp2 = desc.sdp.split("\n").filter((line) => {
        return line.trim() !== "a=extmap-allow-mixed";
      }).join("\n");
      if (window2.RTCSessionDescription && desc instanceof window2.RTCSessionDescription) {
        arguments[0] = new window2.RTCSessionDescription({
          type: desc.type,
          sdp: sdp2
        });
      } else {
        desc.sdp = sdp2;
      }
    }
    return nativeSRD.apply(this, arguments);
  };
}
function shimAddIceCandidateNullOrEmpty(window2, browserDetails) {
  if (!(window2.RTCPeerConnection && window2.RTCPeerConnection.prototype)) {
    return;
  }
  const nativeAddIceCandidate = window2.RTCPeerConnection.prototype.addIceCandidate;
  if (!nativeAddIceCandidate || nativeAddIceCandidate.length === 0) {
    return;
  }
  window2.RTCPeerConnection.prototype.addIceCandidate = function addIceCandidate() {
    if (!arguments[0]) {
      if (arguments[1]) {
        arguments[1].apply(null);
      }
      return Promise.resolve();
    }
    if ((browserDetails.browser === "chrome" && browserDetails.version < 78 || browserDetails.browser === "firefox" && browserDetails.version < 68 || browserDetails.browser === "safari") && arguments[0] && arguments[0].candidate === "") {
      return Promise.resolve();
    }
    return nativeAddIceCandidate.apply(this, arguments);
  };
}
function shimParameterlessSetLocalDescription(window2, browserDetails) {
  if (!(window2.RTCPeerConnection && window2.RTCPeerConnection.prototype)) {
    return;
  }
  const nativeSetLocalDescription = window2.RTCPeerConnection.prototype.setLocalDescription;
  if (!nativeSetLocalDescription || nativeSetLocalDescription.length === 0) {
    return;
  }
  window2.RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription() {
    let desc = arguments[0] || {};
    if (typeof desc !== "object" || desc.type && desc.sdp) {
      return nativeSetLocalDescription.apply(this, arguments);
    }
    desc = { type: desc.type, sdp: desc.sdp };
    if (!desc.type) {
      switch (this.signalingState) {
        case "stable":
        case "have-local-offer":
        case "have-remote-pranswer":
          desc.type = "offer";
          break;
        default:
          desc.type = "answer";
          break;
      }
    }
    if (desc.sdp || desc.type !== "offer" && desc.type !== "answer") {
      return nativeSetLocalDescription.apply(this, [desc]);
    }
    const func = desc.type === "offer" ? this.createOffer : this.createAnswer;
    return func.apply(this).then((d2) => nativeSetLocalDescription.apply(this, [d2]));
  };
}

// node_modules/webrtc-adapter/src/js/adapter_factory.js
var sdp = __toESM(require_sdp());
function adapterFactory({ window: window2 } = {}, options = {
  shimChrome: true,
  shimFirefox: true,
  shimSafari: true
}) {
  const logging2 = log;
  const browserDetails = detectBrowser(window2);
  const adapter2 = {
    browserDetails,
    commonShim: common_shim_exports,
    extractVersion,
    disableLog,
    disableWarnings,
    // Expose sdp as a convenience. For production apps include directly.
    sdp
  };
  switch (browserDetails.browser) {
    case "chrome":
      if (!chrome_shim_exports || !shimPeerConnection || !options.shimChrome) {
        logging2("Chrome shim is not included in this adapter release.");
        return adapter2;
      }
      if (browserDetails.version === null) {
        logging2("Chrome shim can not determine version, not shimming.");
        return adapter2;
      }
      logging2("adapter.js shimming chrome.");
      adapter2.browserShim = chrome_shim_exports;
      shimAddIceCandidateNullOrEmpty(window2, browserDetails);
      shimParameterlessSetLocalDescription(window2, browserDetails);
      shimGetUserMedia(window2, browserDetails);
      shimMediaStream(window2, browserDetails);
      shimPeerConnection(window2, browserDetails);
      shimOnTrack(window2, browserDetails);
      shimAddTrackRemoveTrack(window2, browserDetails);
      shimGetSendersWithDtmf(window2, browserDetails);
      shimSenderReceiverGetStats(window2, browserDetails);
      fixNegotiationNeeded(window2, browserDetails);
      shimRTCIceCandidate(window2, browserDetails);
      shimRTCIceCandidateRelayProtocol(window2, browserDetails);
      shimConnectionState(window2, browserDetails);
      shimMaxMessageSize(window2, browserDetails);
      shimSendThrowTypeError(window2, browserDetails);
      removeExtmapAllowMixed(window2, browserDetails);
      break;
    case "firefox":
      if (!firefox_shim_exports || !shimPeerConnection2 || !options.shimFirefox) {
        logging2("Firefox shim is not included in this adapter release.");
        return adapter2;
      }
      logging2("adapter.js shimming firefox.");
      adapter2.browserShim = firefox_shim_exports;
      shimAddIceCandidateNullOrEmpty(window2, browserDetails);
      shimParameterlessSetLocalDescription(window2, browserDetails);
      shimGetUserMedia2(window2, browserDetails);
      shimPeerConnection2(window2, browserDetails);
      shimOnTrack2(window2, browserDetails);
      shimRemoveStream(window2, browserDetails);
      shimSenderGetStats(window2, browserDetails);
      shimReceiverGetStats(window2, browserDetails);
      shimRTCDataChannel(window2, browserDetails);
      shimAddTransceiver(window2, browserDetails);
      shimGetParameters(window2, browserDetails);
      shimCreateOffer(window2, browserDetails);
      shimCreateAnswer(window2, browserDetails);
      shimRTCIceCandidate(window2, browserDetails);
      shimConnectionState(window2, browserDetails);
      shimMaxMessageSize(window2, browserDetails);
      shimSendThrowTypeError(window2, browserDetails);
      break;
    case "safari":
      if (!safari_shim_exports || !options.shimSafari) {
        logging2("Safari shim is not included in this adapter release.");
        return adapter2;
      }
      logging2("adapter.js shimming safari.");
      adapter2.browserShim = safari_shim_exports;
      shimAddIceCandidateNullOrEmpty(window2, browserDetails);
      shimParameterlessSetLocalDescription(window2, browserDetails);
      shimRTCIceServerUrls(window2, browserDetails);
      shimCreateOfferLegacy(window2, browserDetails);
      shimCallbacksAPI(window2, browserDetails);
      shimLocalStreamsAPI(window2, browserDetails);
      shimRemoteStreamsAPI(window2, browserDetails);
      shimTrackEventTransceiver(window2, browserDetails);
      shimGetUserMedia3(window2, browserDetails);
      shimAudioContext(window2, browserDetails);
      shimRTCIceCandidate(window2, browserDetails);
      shimRTCIceCandidateRelayProtocol(window2, browserDetails);
      shimMaxMessageSize(window2, browserDetails);
      shimSendThrowTypeError(window2, browserDetails);
      removeExtmapAllowMixed(window2, browserDetails);
      break;
    default:
      logging2("Unsupported browser!");
      break;
  }
  return adapter2;
}

// node_modules/webrtc-adapter/src/js/adapter_core.js
var adapter = adapterFactory({ window: typeof window === "undefined" ? void 0 : window });
var adapter_core_default = adapter;

// node_modules/peerjs/dist/bundler.mjs
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, { get: v, set: s, enumerable: true, configurable: true });
}
var $fcbcc7538a6776d5$export$f1c5f4c9cb95390b = class {
  constructor() {
    this.chunkedMTU = 16300;
    this._dataCount = 1;
    this.chunk = (blob) => {
      const chunks = [];
      const size = blob.byteLength;
      const total = Math.ceil(size / this.chunkedMTU);
      let index = 0;
      let start = 0;
      while (start < size) {
        const end = Math.min(size, start + this.chunkedMTU);
        const b2 = blob.slice(start, end);
        const chunk = {
          __peerData: this._dataCount,
          n: index,
          data: b2,
          total
        };
        chunks.push(chunk);
        start = end;
        index++;
      }
      this._dataCount++;
      return chunks;
    };
  }
};
function $fcbcc7538a6776d5$export$52c89ebcdc4f53f2(bufs) {
  let size = 0;
  for (const buf of bufs) size += buf.byteLength;
  const result = new Uint8Array(size);
  let offset = 0;
  for (const buf of bufs) {
    result.set(buf, offset);
    offset += buf.byteLength;
  }
  return result;
}
var $fb63e766cfafaab9$var$webRTCAdapter = (
  //@ts-ignore
  (0, adapter_core_default).default || (0, adapter_core_default)
);
var $fb63e766cfafaab9$export$25be9502477c137d = new class {
  isWebRTCSupported() {
    return typeof RTCPeerConnection !== "undefined";
  }
  isBrowserSupported() {
    const browser = this.getBrowser();
    const version = this.getVersion();
    const validBrowser = this.supportedBrowsers.includes(browser);
    if (!validBrowser) return false;
    if (browser === "chrome") return version >= this.minChromeVersion;
    if (browser === "firefox") return version >= this.minFirefoxVersion;
    if (browser === "safari") return !this.isIOS && version >= this.minSafariVersion;
    return false;
  }
  getBrowser() {
    return $fb63e766cfafaab9$var$webRTCAdapter.browserDetails.browser;
  }
  getVersion() {
    return $fb63e766cfafaab9$var$webRTCAdapter.browserDetails.version || 0;
  }
  isUnifiedPlanSupported() {
    const browser = this.getBrowser();
    const version = $fb63e766cfafaab9$var$webRTCAdapter.browserDetails.version || 0;
    if (browser === "chrome" && version < this.minChromeVersion) return false;
    if (browser === "firefox" && version >= this.minFirefoxVersion) return true;
    if (!window.RTCRtpTransceiver || !("currentDirection" in RTCRtpTransceiver.prototype)) return false;
    let tempPc;
    let supported = false;
    try {
      tempPc = new RTCPeerConnection();
      tempPc.addTransceiver("audio");
      supported = true;
    } catch (e) {
    } finally {
      if (tempPc) tempPc.close();
    }
    return supported;
  }
  toString() {
    return `Supports:
    browser:${this.getBrowser()}
    version:${this.getVersion()}
    isIOS:${this.isIOS}
    isWebRTCSupported:${this.isWebRTCSupported()}
    isBrowserSupported:${this.isBrowserSupported()}
    isUnifiedPlanSupported:${this.isUnifiedPlanSupported()}`;
  }
  constructor() {
    this.isIOS = typeof navigator !== "undefined" ? [
      "iPad",
      "iPhone",
      "iPod"
    ].includes(navigator.platform) : false;
    this.supportedBrowsers = [
      "firefox",
      "chrome",
      "safari"
    ];
    this.minFirefoxVersion = 59;
    this.minChromeVersion = 72;
    this.minSafariVersion = 605;
  }
}();
var $9a84a32bf0bf36bb$export$f35f128fd59ea256 = (id) => {
  return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(id);
};
var $0e5fd1585784c252$export$4e61f672936bec77 = () => Math.random().toString(36).slice(2);
var $4f4134156c446392$var$DEFAULT_CONFIG = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    },
    {
      urls: [
        "turn:eu-0.turn.peerjs.com:3478",
        "turn:us-0.turn.peerjs.com:3478"
      ],
      username: "peerjs",
      credential: "peerjsp"
    }
  ],
  sdpSemantics: "unified-plan"
};
var $4f4134156c446392$export$f8f26dd395d7e1bd = class extends (0, $fcbcc7538a6776d5$export$f1c5f4c9cb95390b) {
  noop() {
  }
  blobToArrayBuffer(blob, cb) {
    const fr = new FileReader();
    fr.onload = function(evt) {
      if (evt.target) cb(evt.target.result);
    };
    fr.readAsArrayBuffer(blob);
    return fr;
  }
  binaryStringToArrayBuffer(binary) {
    const byteArray = new Uint8Array(binary.length);
    for (let i2 = 0; i2 < binary.length; i2++) byteArray[i2] = binary.charCodeAt(i2) & 255;
    return byteArray.buffer;
  }
  isSecure() {
    return location.protocol === "https:";
  }
  constructor(...args) {
    super(...args), this.CLOUD_HOST = "0.peerjs.com", this.CLOUD_PORT = 443, // Browsers that need chunking:
    this.chunkedBrowsers = {
      Chrome: 1,
      chrome: 1
    }, // Returns browser-agnostic default config
    this.defaultConfig = $4f4134156c446392$var$DEFAULT_CONFIG, this.browser = (0, $fb63e766cfafaab9$export$25be9502477c137d).getBrowser(), this.browserVersion = (0, $fb63e766cfafaab9$export$25be9502477c137d).getVersion(), this.pack = $0cfd7828ad59115f$export$2a703dbb0cb35339, this.unpack = $0cfd7828ad59115f$export$417857010dc9287f, /**
    * A hash of WebRTC features mapped to booleans that correspond to whether the feature is supported by the current browser.
    *
    * :::caution
    * Only the properties documented here are guaranteed to be present on `util.supports`
    * :::
    */
    this.supports = function() {
      const supported = {
        browser: (0, $fb63e766cfafaab9$export$25be9502477c137d).isBrowserSupported(),
        webRTC: (0, $fb63e766cfafaab9$export$25be9502477c137d).isWebRTCSupported(),
        audioVideo: false,
        data: false,
        binaryBlob: false,
        reliable: false
      };
      if (!supported.webRTC) return supported;
      let pc;
      try {
        pc = new RTCPeerConnection($4f4134156c446392$var$DEFAULT_CONFIG);
        supported.audioVideo = true;
        let dc;
        try {
          dc = pc.createDataChannel("_PEERJSTEST", {
            ordered: true
          });
          supported.data = true;
          supported.reliable = !!dc.ordered;
          try {
            dc.binaryType = "blob";
            supported.binaryBlob = !(0, $fb63e766cfafaab9$export$25be9502477c137d).isIOS;
          } catch (e) {
          }
        } catch (e) {
        } finally {
          if (dc) dc.close();
        }
      } catch (e) {
      } finally {
        if (pc) pc.close();
      }
      return supported;
    }(), // Ensure alphanumeric ids
    this.validateId = (0, $9a84a32bf0bf36bb$export$f35f128fd59ea256), this.randomToken = (0, $0e5fd1585784c252$export$4e61f672936bec77);
  }
};
var $4f4134156c446392$export$7debb50ef11d5e0b = new $4f4134156c446392$export$f8f26dd395d7e1bd();
var $257947e92926277a$var$LOG_PREFIX = "PeerJS: ";
var $257947e92926277a$var$Logger = class {
  get logLevel() {
    return this._logLevel;
  }
  set logLevel(logLevel) {
    this._logLevel = logLevel;
  }
  log(...args) {
    if (this._logLevel >= 3) this._print(3, ...args);
  }
  warn(...args) {
    if (this._logLevel >= 2) this._print(2, ...args);
  }
  error(...args) {
    if (this._logLevel >= 1) this._print(1, ...args);
  }
  setLogFunction(fn) {
    this._print = fn;
  }
  _print(logLevel, ...rest) {
    const copy = [
      $257947e92926277a$var$LOG_PREFIX,
      ...rest
    ];
    for (const i2 in copy) if (copy[i2] instanceof Error) copy[i2] = "(" + copy[i2].name + ") " + copy[i2].message;
    if (logLevel >= 3) console.log(...copy);
    else if (logLevel >= 2) console.warn("WARNING", ...copy);
    else if (logLevel >= 1) console.error("ERROR", ...copy);
  }
  constructor() {
    this._logLevel = 0;
  }
};
var $257947e92926277a$export$2e2bcd8739ae039 = new $257947e92926277a$var$Logger();
var $c4dcfd1d1ea86647$exports = {};
var $c4dcfd1d1ea86647$var$has = Object.prototype.hasOwnProperty;
var $c4dcfd1d1ea86647$var$prefix = "~";
function $c4dcfd1d1ea86647$var$Events() {
}
if (Object.create) {
  $c4dcfd1d1ea86647$var$Events.prototype = /* @__PURE__ */ Object.create(null);
  if (!new $c4dcfd1d1ea86647$var$Events().__proto__) $c4dcfd1d1ea86647$var$prefix = false;
}
function $c4dcfd1d1ea86647$var$EE(fn, context, once2) {
  this.fn = fn;
  this.context = context;
  this.once = once2 || false;
}
function $c4dcfd1d1ea86647$var$addListener(emitter, event, fn, context, once2) {
  if (typeof fn !== "function") throw new TypeError("The listener must be a function");
  var listener = new $c4dcfd1d1ea86647$var$EE(fn, context || emitter, once2), evt = $c4dcfd1d1ea86647$var$prefix ? $c4dcfd1d1ea86647$var$prefix + event : event;
  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [
    emitter._events[evt],
    listener
  ];
  return emitter;
}
function $c4dcfd1d1ea86647$var$clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new $c4dcfd1d1ea86647$var$Events();
  else delete emitter._events[evt];
}
function $c4dcfd1d1ea86647$var$EventEmitter() {
  this._events = new $c4dcfd1d1ea86647$var$Events();
  this._eventsCount = 0;
}
$c4dcfd1d1ea86647$var$EventEmitter.prototype.eventNames = function eventNames() {
  var names = [], events, name;
  if (this._eventsCount === 0) return names;
  for (name in events = this._events) if ($c4dcfd1d1ea86647$var$has.call(events, name)) names.push($c4dcfd1d1ea86647$var$prefix ? name.slice(1) : name);
  if (Object.getOwnPropertySymbols) return names.concat(Object.getOwnPropertySymbols(events));
  return names;
};
$c4dcfd1d1ea86647$var$EventEmitter.prototype.listeners = function listeners(event) {
  var evt = $c4dcfd1d1ea86647$var$prefix ? $c4dcfd1d1ea86647$var$prefix + event : event, handlers = this._events[evt];
  if (!handlers) return [];
  if (handlers.fn) return [
    handlers.fn
  ];
  for (var i2 = 0, l2 = handlers.length, ee = new Array(l2); i2 < l2; i2++) ee[i2] = handlers[i2].fn;
  return ee;
};
$c4dcfd1d1ea86647$var$EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = $c4dcfd1d1ea86647$var$prefix ? $c4dcfd1d1ea86647$var$prefix + event : event, listeners2 = this._events[evt];
  if (!listeners2) return 0;
  if (listeners2.fn) return 1;
  return listeners2.length;
};
$c4dcfd1d1ea86647$var$EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = $c4dcfd1d1ea86647$var$prefix ? $c4dcfd1d1ea86647$var$prefix + event : event;
  if (!this._events[evt]) return false;
  var listeners2 = this._events[evt], len = arguments.length, args, i2;
  if (listeners2.fn) {
    if (listeners2.once) this.removeListener(event, listeners2.fn, void 0, true);
    switch (len) {
      case 1:
        return listeners2.fn.call(listeners2.context), true;
      case 2:
        return listeners2.fn.call(listeners2.context, a1), true;
      case 3:
        return listeners2.fn.call(listeners2.context, a1, a2), true;
      case 4:
        return listeners2.fn.call(listeners2.context, a1, a2, a3), true;
      case 5:
        return listeners2.fn.call(listeners2.context, a1, a2, a3, a4), true;
      case 6:
        return listeners2.fn.call(listeners2.context, a1, a2, a3, a4, a5), true;
    }
    for (i2 = 1, args = new Array(len - 1); i2 < len; i2++) args[i2 - 1] = arguments[i2];
    listeners2.fn.apply(listeners2.context, args);
  } else {
    var length = listeners2.length, j;
    for (i2 = 0; i2 < length; i2++) {
      if (listeners2[i2].once) this.removeListener(event, listeners2[i2].fn, void 0, true);
      switch (len) {
        case 1:
          listeners2[i2].fn.call(listeners2[i2].context);
          break;
        case 2:
          listeners2[i2].fn.call(listeners2[i2].context, a1);
          break;
        case 3:
          listeners2[i2].fn.call(listeners2[i2].context, a1, a2);
          break;
        case 4:
          listeners2[i2].fn.call(listeners2[i2].context, a1, a2, a3);
          break;
        default:
          if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) args[j - 1] = arguments[j];
          listeners2[i2].fn.apply(listeners2[i2].context, args);
      }
    }
  }
  return true;
};
$c4dcfd1d1ea86647$var$EventEmitter.prototype.on = function on(event, fn, context) {
  return $c4dcfd1d1ea86647$var$addListener(this, event, fn, context, false);
};
$c4dcfd1d1ea86647$var$EventEmitter.prototype.once = function once(event, fn, context) {
  return $c4dcfd1d1ea86647$var$addListener(this, event, fn, context, true);
};
$c4dcfd1d1ea86647$var$EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once2) {
  var evt = $c4dcfd1d1ea86647$var$prefix ? $c4dcfd1d1ea86647$var$prefix + event : event;
  if (!this._events[evt]) return this;
  if (!fn) {
    $c4dcfd1d1ea86647$var$clearEvent(this, evt);
    return this;
  }
  var listeners2 = this._events[evt];
  if (listeners2.fn) {
    if (listeners2.fn === fn && (!once2 || listeners2.once) && (!context || listeners2.context === context)) $c4dcfd1d1ea86647$var$clearEvent(this, evt);
  } else {
    for (var i2 = 0, events = [], length = listeners2.length; i2 < length; i2++) if (listeners2[i2].fn !== fn || once2 && !listeners2[i2].once || context && listeners2[i2].context !== context) events.push(listeners2[i2]);
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else $c4dcfd1d1ea86647$var$clearEvent(this, evt);
  }
  return this;
};
$c4dcfd1d1ea86647$var$EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;
  if (event) {
    evt = $c4dcfd1d1ea86647$var$prefix ? $c4dcfd1d1ea86647$var$prefix + event : event;
    if (this._events[evt]) $c4dcfd1d1ea86647$var$clearEvent(this, evt);
  } else {
    this._events = new $c4dcfd1d1ea86647$var$Events();
    this._eventsCount = 0;
  }
  return this;
};
$c4dcfd1d1ea86647$var$EventEmitter.prototype.off = $c4dcfd1d1ea86647$var$EventEmitter.prototype.removeListener;
$c4dcfd1d1ea86647$var$EventEmitter.prototype.addListener = $c4dcfd1d1ea86647$var$EventEmitter.prototype.on;
$c4dcfd1d1ea86647$var$EventEmitter.prefixed = $c4dcfd1d1ea86647$var$prefix;
$c4dcfd1d1ea86647$var$EventEmitter.EventEmitter = $c4dcfd1d1ea86647$var$EventEmitter;
$c4dcfd1d1ea86647$exports = $c4dcfd1d1ea86647$var$EventEmitter;
var $78455e22dea96b8c$exports = {};
$parcel$export($78455e22dea96b8c$exports, "ConnectionType", () => $78455e22dea96b8c$export$3157d57b4135e3bc);
$parcel$export($78455e22dea96b8c$exports, "PeerErrorType", () => $78455e22dea96b8c$export$9547aaa2e39030ff);
$parcel$export($78455e22dea96b8c$exports, "BaseConnectionErrorType", () => $78455e22dea96b8c$export$7974935686149686);
$parcel$export($78455e22dea96b8c$exports, "DataConnectionErrorType", () => $78455e22dea96b8c$export$49ae800c114df41d);
$parcel$export($78455e22dea96b8c$exports, "SerializationType", () => $78455e22dea96b8c$export$89f507cf986a947);
$parcel$export($78455e22dea96b8c$exports, "SocketEventType", () => $78455e22dea96b8c$export$3b5c4a4b6354f023);
$parcel$export($78455e22dea96b8c$exports, "ServerMessageType", () => $78455e22dea96b8c$export$adb4a1754da6f10d);
var $78455e22dea96b8c$export$3157d57b4135e3bc = /* @__PURE__ */ function(ConnectionType) {
  ConnectionType["Data"] = "data";
  ConnectionType["Media"] = "media";
  return ConnectionType;
}({});
var $78455e22dea96b8c$export$9547aaa2e39030ff = /* @__PURE__ */ function(PeerErrorType) {
  PeerErrorType["BrowserIncompatible"] = "browser-incompatible";
  PeerErrorType["Disconnected"] = "disconnected";
  PeerErrorType["InvalidID"] = "invalid-id";
  PeerErrorType["InvalidKey"] = "invalid-key";
  PeerErrorType["Network"] = "network";
  PeerErrorType["PeerUnavailable"] = "peer-unavailable";
  PeerErrorType["SslUnavailable"] = "ssl-unavailable";
  PeerErrorType["ServerError"] = "server-error";
  PeerErrorType["SocketError"] = "socket-error";
  PeerErrorType["SocketClosed"] = "socket-closed";
  PeerErrorType["UnavailableID"] = "unavailable-id";
  PeerErrorType["WebRTC"] = "webrtc";
  return PeerErrorType;
}({});
var $78455e22dea96b8c$export$7974935686149686 = /* @__PURE__ */ function(BaseConnectionErrorType) {
  BaseConnectionErrorType["NegotiationFailed"] = "negotiation-failed";
  BaseConnectionErrorType["ConnectionClosed"] = "connection-closed";
  return BaseConnectionErrorType;
}({});
var $78455e22dea96b8c$export$49ae800c114df41d = /* @__PURE__ */ function(DataConnectionErrorType) {
  DataConnectionErrorType["NotOpenYet"] = "not-open-yet";
  DataConnectionErrorType["MessageToBig"] = "message-too-big";
  return DataConnectionErrorType;
}({});
var $78455e22dea96b8c$export$89f507cf986a947 = /* @__PURE__ */ function(SerializationType) {
  SerializationType["Binary"] = "binary";
  SerializationType["BinaryUTF8"] = "binary-utf8";
  SerializationType["JSON"] = "json";
  SerializationType["None"] = "raw";
  return SerializationType;
}({});
var $78455e22dea96b8c$export$3b5c4a4b6354f023 = /* @__PURE__ */ function(SocketEventType) {
  SocketEventType["Message"] = "message";
  SocketEventType["Disconnected"] = "disconnected";
  SocketEventType["Error"] = "error";
  SocketEventType["Close"] = "close";
  return SocketEventType;
}({});
var $78455e22dea96b8c$export$adb4a1754da6f10d = /* @__PURE__ */ function(ServerMessageType2) {
  ServerMessageType2["Heartbeat"] = "HEARTBEAT";
  ServerMessageType2["Candidate"] = "CANDIDATE";
  ServerMessageType2["Offer"] = "OFFER";
  ServerMessageType2["Answer"] = "ANSWER";
  ServerMessageType2["Open"] = "OPEN";
  ServerMessageType2["Error"] = "ERROR";
  ServerMessageType2["IdTaken"] = "ID-TAKEN";
  ServerMessageType2["InvalidKey"] = "INVALID-KEY";
  ServerMessageType2["Leave"] = "LEAVE";
  ServerMessageType2["Expire"] = "EXPIRE";
  return ServerMessageType2;
}({});
var $520832d44ba058c8$export$83d89fbfd8236492 = "1.5.5";
var $8f5bfa60836d261d$export$4798917dbf149b79 = class extends (0, $c4dcfd1d1ea86647$exports.EventEmitter) {
  constructor(secure, host, port, path, key, pingInterval = 5e3) {
    super(), this.pingInterval = pingInterval, this._disconnected = true, this._messagesQueue = [];
    const wsProtocol = secure ? "wss://" : "ws://";
    this._baseUrl = wsProtocol + host + ":" + port + path + "peerjs?key=" + key;
  }
  start(id, token) {
    this._id = id;
    const wsUrl = `${this._baseUrl}&id=${id}&token=${token}`;
    if (!!this._socket || !this._disconnected) return;
    this._socket = new WebSocket(wsUrl + "&version=" + (0, $520832d44ba058c8$export$83d89fbfd8236492));
    this._disconnected = false;
    this._socket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
        (0, $257947e92926277a$export$2e2bcd8739ae039).log("Server message received:", data);
      } catch (e) {
        (0, $257947e92926277a$export$2e2bcd8739ae039).log("Invalid server message", event.data);
        return;
      }
      this.emit((0, $78455e22dea96b8c$export$3b5c4a4b6354f023).Message, data);
    };
    this._socket.onclose = (event) => {
      if (this._disconnected) return;
      (0, $257947e92926277a$export$2e2bcd8739ae039).log("Socket closed.", event);
      this._cleanup();
      this._disconnected = true;
      this.emit((0, $78455e22dea96b8c$export$3b5c4a4b6354f023).Disconnected);
    };
    this._socket.onopen = () => {
      if (this._disconnected) return;
      this._sendQueuedMessages();
      (0, $257947e92926277a$export$2e2bcd8739ae039).log("Socket open");
      this._scheduleHeartbeat();
    };
  }
  _scheduleHeartbeat() {
    this._wsPingTimer = setTimeout(() => {
      this._sendHeartbeat();
    }, this.pingInterval);
  }
  _sendHeartbeat() {
    if (!this._wsOpen()) {
      (0, $257947e92926277a$export$2e2bcd8739ae039).log(`Cannot send heartbeat, because socket closed`);
      return;
    }
    const message = JSON.stringify({
      type: (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Heartbeat
    });
    this._socket.send(message);
    this._scheduleHeartbeat();
  }
  /** Is the websocket currently open? */
  _wsOpen() {
    return !!this._socket && this._socket.readyState === 1;
  }
  /** Send queued messages. */
  _sendQueuedMessages() {
    const copiedQueue = [
      ...this._messagesQueue
    ];
    this._messagesQueue = [];
    for (const message of copiedQueue) this.send(message);
  }
  /** Exposed send for DC & Peer. */
  send(data) {
    if (this._disconnected) return;
    if (!this._id) {
      this._messagesQueue.push(data);
      return;
    }
    if (!data.type) {
      this.emit((0, $78455e22dea96b8c$export$3b5c4a4b6354f023).Error, "Invalid message");
      return;
    }
    if (!this._wsOpen()) return;
    const message = JSON.stringify(data);
    this._socket.send(message);
  }
  close() {
    if (this._disconnected) return;
    this._cleanup();
    this._disconnected = true;
  }
  _cleanup() {
    if (this._socket) {
      this._socket.onopen = this._socket.onmessage = this._socket.onclose = null;
      this._socket.close();
      this._socket = void 0;
    }
    clearTimeout(this._wsPingTimer);
  }
};
var $b82fb8fc0514bfc1$export$89e6bb5ad64bf4a = class {
  constructor(connection) {
    this.connection = connection;
  }
  /** Returns a PeerConnection object set up correctly (for data, media). */
  startConnection(options) {
    const peerConnection = this._startPeerConnection();
    this.connection.peerConnection = peerConnection;
    if (this.connection.type === (0, $78455e22dea96b8c$export$3157d57b4135e3bc).Media && options._stream) this._addTracksToConnection(options._stream, peerConnection);
    if (options.originator) {
      const dataConnection = this.connection;
      const config = {
        ordered: !!options.reliable
      };
      const dataChannel = peerConnection.createDataChannel(dataConnection.label, config);
      dataConnection._initializeDataChannel(dataChannel);
      this._makeOffer();
    } else this.handleSDP("OFFER", options.sdp);
  }
  /** Start a PC. */
  _startPeerConnection() {
    (0, $257947e92926277a$export$2e2bcd8739ae039).log("Creating RTCPeerConnection.");
    const peerConnection = new RTCPeerConnection(this.connection.provider.options.config);
    this._setupListeners(peerConnection);
    return peerConnection;
  }
  /** Set up various WebRTC listeners. */
  _setupListeners(peerConnection) {
    const peerId = this.connection.peer;
    const connectionId = this.connection.connectionId;
    const connectionType = this.connection.type;
    const provider = this.connection.provider;
    (0, $257947e92926277a$export$2e2bcd8739ae039).log("Listening for ICE candidates.");
    peerConnection.onicecandidate = (evt) => {
      if (!evt.candidate || !evt.candidate.candidate) return;
      (0, $257947e92926277a$export$2e2bcd8739ae039).log(`Received ICE candidates for ${peerId}:`, evt.candidate);
      provider.socket.send({
        type: (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Candidate,
        payload: {
          candidate: evt.candidate,
          type: connectionType,
          connectionId
        },
        dst: peerId
      });
    };
    peerConnection.oniceconnectionstatechange = () => {
      switch (peerConnection.iceConnectionState) {
        case "failed":
          (0, $257947e92926277a$export$2e2bcd8739ae039).log("iceConnectionState is failed, closing connections to " + peerId);
          this.connection.emitError((0, $78455e22dea96b8c$export$7974935686149686).NegotiationFailed, "Negotiation of connection to " + peerId + " failed.");
          this.connection.close();
          break;
        case "closed":
          (0, $257947e92926277a$export$2e2bcd8739ae039).log("iceConnectionState is closed, closing connections to " + peerId);
          this.connection.emitError((0, $78455e22dea96b8c$export$7974935686149686).ConnectionClosed, "Connection to " + peerId + " closed.");
          this.connection.close();
          break;
        case "disconnected":
          (0, $257947e92926277a$export$2e2bcd8739ae039).log("iceConnectionState changed to disconnected on the connection with " + peerId);
          break;
        case "completed":
          peerConnection.onicecandidate = () => {
          };
          break;
      }
      this.connection.emit("iceStateChanged", peerConnection.iceConnectionState);
    };
    (0, $257947e92926277a$export$2e2bcd8739ae039).log("Listening for data channel");
    peerConnection.ondatachannel = (evt) => {
      (0, $257947e92926277a$export$2e2bcd8739ae039).log("Received data channel");
      const dataChannel = evt.channel;
      const connection = provider.getConnection(peerId, connectionId);
      connection._initializeDataChannel(dataChannel);
    };
    (0, $257947e92926277a$export$2e2bcd8739ae039).log("Listening for remote stream");
    peerConnection.ontrack = (evt) => {
      (0, $257947e92926277a$export$2e2bcd8739ae039).log("Received remote stream");
      const stream = evt.streams[0];
      const connection = provider.getConnection(peerId, connectionId);
      if (connection.type === (0, $78455e22dea96b8c$export$3157d57b4135e3bc).Media) {
        const mediaConnection = connection;
        this._addStreamToMediaConnection(stream, mediaConnection);
      }
    };
  }
  cleanup() {
    (0, $257947e92926277a$export$2e2bcd8739ae039).log("Cleaning up PeerConnection to " + this.connection.peer);
    const peerConnection = this.connection.peerConnection;
    if (!peerConnection) return;
    this.connection.peerConnection = null;
    peerConnection.onicecandidate = peerConnection.oniceconnectionstatechange = peerConnection.ondatachannel = peerConnection.ontrack = () => {
    };
    const peerConnectionNotClosed = peerConnection.signalingState !== "closed";
    let dataChannelNotClosed = false;
    const dataChannel = this.connection.dataChannel;
    if (dataChannel) dataChannelNotClosed = !!dataChannel.readyState && dataChannel.readyState !== "closed";
    if (peerConnectionNotClosed || dataChannelNotClosed) peerConnection.close();
  }
  async _makeOffer() {
    const peerConnection = this.connection.peerConnection;
    const provider = this.connection.provider;
    try {
      const offer = await peerConnection.createOffer(this.connection.options.constraints);
      (0, $257947e92926277a$export$2e2bcd8739ae039).log("Created offer.");
      if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === "function") offer.sdp = this.connection.options.sdpTransform(offer.sdp) || offer.sdp;
      try {
        await peerConnection.setLocalDescription(offer);
        (0, $257947e92926277a$export$2e2bcd8739ae039).log("Set localDescription:", offer, `for:${this.connection.peer}`);
        let payload = {
          sdp: offer,
          type: this.connection.type,
          connectionId: this.connection.connectionId,
          metadata: this.connection.metadata
        };
        if (this.connection.type === (0, $78455e22dea96b8c$export$3157d57b4135e3bc).Data) {
          const dataConnection = this.connection;
          payload = {
            ...payload,
            label: dataConnection.label,
            reliable: dataConnection.reliable,
            serialization: dataConnection.serialization
          };
        }
        provider.socket.send({
          type: (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Offer,
          payload,
          dst: this.connection.peer
        });
      } catch (err) {
        if (err != "OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer") {
          provider.emitError((0, $78455e22dea96b8c$export$9547aaa2e39030ff).WebRTC, err);
          (0, $257947e92926277a$export$2e2bcd8739ae039).log("Failed to setLocalDescription, ", err);
        }
      }
    } catch (err_1) {
      provider.emitError((0, $78455e22dea96b8c$export$9547aaa2e39030ff).WebRTC, err_1);
      (0, $257947e92926277a$export$2e2bcd8739ae039).log("Failed to createOffer, ", err_1);
    }
  }
  async _makeAnswer() {
    const peerConnection = this.connection.peerConnection;
    const provider = this.connection.provider;
    try {
      const answer = await peerConnection.createAnswer();
      (0, $257947e92926277a$export$2e2bcd8739ae039).log("Created answer.");
      if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === "function") answer.sdp = this.connection.options.sdpTransform(answer.sdp) || answer.sdp;
      try {
        await peerConnection.setLocalDescription(answer);
        (0, $257947e92926277a$export$2e2bcd8739ae039).log(`Set localDescription:`, answer, `for:${this.connection.peer}`);
        provider.socket.send({
          type: (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Answer,
          payload: {
            sdp: answer,
            type: this.connection.type,
            connectionId: this.connection.connectionId
          },
          dst: this.connection.peer
        });
      } catch (err) {
        provider.emitError((0, $78455e22dea96b8c$export$9547aaa2e39030ff).WebRTC, err);
        (0, $257947e92926277a$export$2e2bcd8739ae039).log("Failed to setLocalDescription, ", err);
      }
    } catch (err_1) {
      provider.emitError((0, $78455e22dea96b8c$export$9547aaa2e39030ff).WebRTC, err_1);
      (0, $257947e92926277a$export$2e2bcd8739ae039).log("Failed to create answer, ", err_1);
    }
  }
  /** Handle an SDP. */
  async handleSDP(type, sdp2) {
    sdp2 = new RTCSessionDescription(sdp2);
    const peerConnection = this.connection.peerConnection;
    const provider = this.connection.provider;
    (0, $257947e92926277a$export$2e2bcd8739ae039).log("Setting remote description", sdp2);
    const self2 = this;
    try {
      await peerConnection.setRemoteDescription(sdp2);
      (0, $257947e92926277a$export$2e2bcd8739ae039).log(`Set remoteDescription:${type} for:${this.connection.peer}`);
      if (type === "OFFER") await self2._makeAnswer();
    } catch (err) {
      provider.emitError((0, $78455e22dea96b8c$export$9547aaa2e39030ff).WebRTC, err);
      (0, $257947e92926277a$export$2e2bcd8739ae039).log("Failed to setRemoteDescription, ", err);
    }
  }
  /** Handle a candidate. */
  async handleCandidate(ice) {
    (0, $257947e92926277a$export$2e2bcd8739ae039).log(`handleCandidate:`, ice);
    try {
      await this.connection.peerConnection.addIceCandidate(ice);
      (0, $257947e92926277a$export$2e2bcd8739ae039).log(`Added ICE candidate for:${this.connection.peer}`);
    } catch (err) {
      this.connection.provider.emitError((0, $78455e22dea96b8c$export$9547aaa2e39030ff).WebRTC, err);
      (0, $257947e92926277a$export$2e2bcd8739ae039).log("Failed to handleCandidate, ", err);
    }
  }
  _addTracksToConnection(stream, peerConnection) {
    (0, $257947e92926277a$export$2e2bcd8739ae039).log(`add tracks from stream ${stream.id} to peer connection`);
    if (!peerConnection.addTrack) return (0, $257947e92926277a$export$2e2bcd8739ae039).error(`Your browser does't support RTCPeerConnection#addTrack. Ignored.`);
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });
  }
  _addStreamToMediaConnection(stream, mediaConnection) {
    (0, $257947e92926277a$export$2e2bcd8739ae039).log(`add stream ${stream.id} to media connection ${mediaConnection.connectionId}`);
    mediaConnection.addStream(stream);
  }
};
var $23779d1881157a18$export$6a678e589c8a4542 = class extends (0, $c4dcfd1d1ea86647$exports.EventEmitter) {
  /**
  * Emits a typed error message.
  *
  * @internal
  */
  emitError(type, err) {
    (0, $257947e92926277a$export$2e2bcd8739ae039).error("Error:", err);
    this.emit("error", new $23779d1881157a18$export$98871882f492de82(`${type}`, err));
  }
};
var $23779d1881157a18$export$98871882f492de82 = class extends Error {
  /**
  * @internal
  */
  constructor(type, err) {
    if (typeof err === "string") super(err);
    else {
      super();
      Object.assign(this, err);
    }
    this.type = type;
  }
};
var $5045192fc6d387ba$export$23a2a68283c24d80 = class extends (0, $23779d1881157a18$export$6a678e589c8a4542) {
  /**
  * Whether the media connection is active (e.g. your call has been answered).
  * You can check this if you want to set a maximum wait time for a one-sided call.
  */
  get open() {
    return this._open;
  }
  constructor(peer, provider, options) {
    super(), this.peer = peer, this.provider = provider, this.options = options, this._open = false;
    this.metadata = options.metadata;
  }
};
var $5c1d08c7c57da9a3$export$4a84e95a2324ac29 = class _$5c1d08c7c57da9a3$export$4a84e95a2324ac29 extends (0, $5045192fc6d387ba$export$23a2a68283c24d80) {
  static #_ = this.ID_PREFIX = "mc_";
  /**
  * For media connections, this is always 'media'.
  */
  get type() {
    return (0, $78455e22dea96b8c$export$3157d57b4135e3bc).Media;
  }
  get localStream() {
    return this._localStream;
  }
  get remoteStream() {
    return this._remoteStream;
  }
  constructor(peerId, provider, options) {
    super(peerId, provider, options);
    this._localStream = this.options._stream;
    this.connectionId = this.options.connectionId || _$5c1d08c7c57da9a3$export$4a84e95a2324ac29.ID_PREFIX + (0, $4f4134156c446392$export$7debb50ef11d5e0b).randomToken();
    this._negotiator = new (0, $b82fb8fc0514bfc1$export$89e6bb5ad64bf4a)(this);
    if (this._localStream) this._negotiator.startConnection({
      _stream: this._localStream,
      originator: true
    });
  }
  /** Called by the Negotiator when the DataChannel is ready. */
  _initializeDataChannel(dc) {
    this.dataChannel = dc;
    this.dataChannel.onopen = () => {
      (0, $257947e92926277a$export$2e2bcd8739ae039).log(`DC#${this.connectionId} dc connection success`);
      this.emit("willCloseOnRemote");
    };
    this.dataChannel.onclose = () => {
      (0, $257947e92926277a$export$2e2bcd8739ae039).log(`DC#${this.connectionId} dc closed for:`, this.peer);
      this.close();
    };
  }
  addStream(remoteStream) {
    (0, $257947e92926277a$export$2e2bcd8739ae039).log("Receiving stream", remoteStream);
    this._remoteStream = remoteStream;
    super.emit("stream", remoteStream);
  }
  /**
  * @internal
  */
  handleMessage(message) {
    const type = message.type;
    const payload = message.payload;
    switch (message.type) {
      case (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Answer:
        this._negotiator.handleSDP(type, payload.sdp);
        this._open = true;
        break;
      case (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Candidate:
        this._negotiator.handleCandidate(payload.candidate);
        break;
      default:
        (0, $257947e92926277a$export$2e2bcd8739ae039).warn(`Unrecognized message type:${type} from peer:${this.peer}`);
        break;
    }
  }
  /**
       * When receiving a {@apilink PeerEvents | `call`} event on a peer, you can call
       * `answer` on the media connection provided by the callback to accept the call
       * and optionally send your own media stream.
  
       *
       * @param stream A WebRTC media stream.
       * @param options
       * @returns
       */
  answer(stream, options = {}) {
    if (this._localStream) {
      (0, $257947e92926277a$export$2e2bcd8739ae039).warn("Local stream already exists on this MediaConnection. Are you answering a call twice?");
      return;
    }
    this._localStream = stream;
    if (options && options.sdpTransform) this.options.sdpTransform = options.sdpTransform;
    this._negotiator.startConnection({
      ...this.options._payload,
      _stream: stream
    });
    const messages = this.provider._getMessages(this.connectionId);
    for (const message of messages) this.handleMessage(message);
    this._open = true;
  }
  /**
  * Exposed functionality for users.
  */
  /**
  * Closes the media connection.
  */
  close() {
    if (this._negotiator) {
      this._negotiator.cleanup();
      this._negotiator = null;
    }
    this._localStream = null;
    this._remoteStream = null;
    if (this.provider) {
      this.provider._removeConnection(this);
      this.provider = null;
    }
    if (this.options && this.options._stream) this.options._stream = null;
    if (!this.open) return;
    this._open = false;
    super.emit("close");
  }
};
var $abf266641927cd89$export$2c4e825dc9120f87 = class {
  constructor(_options) {
    this._options = _options;
  }
  _buildRequest(method) {
    const protocol = this._options.secure ? "https" : "http";
    const { host, port, path, key } = this._options;
    const url = new URL(`${protocol}://${host}:${port}${path}${key}/${method}`);
    url.searchParams.set("ts", `${Date.now()}${Math.random()}`);
    url.searchParams.set("version", (0, $520832d44ba058c8$export$83d89fbfd8236492));
    return fetch(url.href, {
      referrerPolicy: this._options.referrerPolicy
    });
  }
  /** Get a unique ID from the server via XHR and initialize with it. */
  async retrieveId() {
    try {
      const response = await this._buildRequest("id");
      if (response.status !== 200) throw new Error(`Error. Status:${response.status}`);
      return response.text();
    } catch (error) {
      (0, $257947e92926277a$export$2e2bcd8739ae039).error("Error retrieving ID", error);
      let pathError = "";
      if (this._options.path === "/" && this._options.host !== (0, $4f4134156c446392$export$7debb50ef11d5e0b).CLOUD_HOST) pathError = " If you passed in a `path` to your self-hosted PeerServer, you'll also need to pass in that same path when creating a new Peer.";
      throw new Error("Could not get an ID from the server." + pathError);
    }
  }
  /** @deprecated */
  async listAllPeers() {
    try {
      const response = await this._buildRequest("peers");
      if (response.status !== 200) {
        if (response.status === 401) {
          let helpfulError = "";
          if (this._options.host === (0, $4f4134156c446392$export$7debb50ef11d5e0b).CLOUD_HOST) helpfulError = "It looks like you're using the cloud server. You can email team@peerjs.com to enable peer listing for your API key.";
          else helpfulError = "You need to enable `allow_discovery` on your self-hosted PeerServer to use this feature.";
          throw new Error("It doesn't look like you have permission to list peers IDs. " + helpfulError);
        }
        throw new Error(`Error. Status:${response.status}`);
      }
      return response.json();
    } catch (error) {
      (0, $257947e92926277a$export$2e2bcd8739ae039).error("Error retrieving list peers", error);
      throw new Error("Could not get list peers from the server." + error);
    }
  }
};
var $6366c4ca161bc297$export$d365f7ad9d7df9c9 = class _$6366c4ca161bc297$export$d365f7ad9d7df9c9 extends (0, $5045192fc6d387ba$export$23a2a68283c24d80) {
  static #_ = this.ID_PREFIX = "dc_";
  static #_2 = this.MAX_BUFFERED_AMOUNT = 8388608;
  get type() {
    return (0, $78455e22dea96b8c$export$3157d57b4135e3bc).Data;
  }
  constructor(peerId, provider, options) {
    super(peerId, provider, options);
    this.connectionId = this.options.connectionId || _$6366c4ca161bc297$export$d365f7ad9d7df9c9.ID_PREFIX + (0, $0e5fd1585784c252$export$4e61f672936bec77)();
    this.label = this.options.label || this.connectionId;
    this.reliable = !!this.options.reliable;
    this._negotiator = new (0, $b82fb8fc0514bfc1$export$89e6bb5ad64bf4a)(this);
    this._negotiator.startConnection(this.options._payload || {
      originator: true,
      reliable: this.reliable
    });
  }
  /** Called by the Negotiator when the DataChannel is ready. */
  _initializeDataChannel(dc) {
    this.dataChannel = dc;
    this.dataChannel.onopen = () => {
      (0, $257947e92926277a$export$2e2bcd8739ae039).log(`DC#${this.connectionId} dc connection success`);
      this._open = true;
      this.emit("open");
    };
    this.dataChannel.onmessage = (e) => {
      (0, $257947e92926277a$export$2e2bcd8739ae039).log(`DC#${this.connectionId} dc onmessage:`, e.data);
    };
    this.dataChannel.onclose = () => {
      (0, $257947e92926277a$export$2e2bcd8739ae039).log(`DC#${this.connectionId} dc closed for:`, this.peer);
      this.close();
    };
  }
  /**
  * Exposed functionality for users.
  */
  /** Allows user to close connection. */
  close(options) {
    if (options?.flush) {
      this.send({
        __peerData: {
          type: "close"
        }
      });
      return;
    }
    if (this._negotiator) {
      this._negotiator.cleanup();
      this._negotiator = null;
    }
    if (this.provider) {
      this.provider._removeConnection(this);
      this.provider = null;
    }
    if (this.dataChannel) {
      this.dataChannel.onopen = null;
      this.dataChannel.onmessage = null;
      this.dataChannel.onclose = null;
      this.dataChannel = null;
    }
    if (!this.open) return;
    this._open = false;
    super.emit("close");
  }
  /** Allows user to send data. */
  send(data, chunked = false) {
    if (!this.open) {
      this.emitError((0, $78455e22dea96b8c$export$49ae800c114df41d).NotOpenYet, "Connection is not open. You should listen for the `open` event before sending messages.");
      return;
    }
    return this._send(data, chunked);
  }
  async handleMessage(message) {
    const payload = message.payload;
    switch (message.type) {
      case (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Answer:
        await this._negotiator.handleSDP(message.type, payload.sdp);
        break;
      case (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Candidate:
        await this._negotiator.handleCandidate(payload.candidate);
        break;
      default:
        (0, $257947e92926277a$export$2e2bcd8739ae039).warn("Unrecognized message type:", message.type, "from peer:", this.peer);
        break;
    }
  }
};
var $a229bedbcaa6ca23$export$ff7c9d4c11d94e8b = class extends (0, $6366c4ca161bc297$export$d365f7ad9d7df9c9) {
  get bufferSize() {
    return this._bufferSize;
  }
  _initializeDataChannel(dc) {
    super._initializeDataChannel(dc);
    this.dataChannel.binaryType = "arraybuffer";
    this.dataChannel.addEventListener("message", (e) => this._handleDataMessage(e));
  }
  _bufferedSend(msg) {
    if (this._buffering || !this._trySend(msg)) {
      this._buffer.push(msg);
      this._bufferSize = this._buffer.length;
    }
  }
  // Returns true if the send succeeds.
  _trySend(msg) {
    if (!this.open) return false;
    if (this.dataChannel.bufferedAmount > (0, $6366c4ca161bc297$export$d365f7ad9d7df9c9).MAX_BUFFERED_AMOUNT) {
      this._buffering = true;
      setTimeout(() => {
        this._buffering = false;
        this._tryBuffer();
      }, 50);
      return false;
    }
    try {
      this.dataChannel.send(msg);
    } catch (e) {
      (0, $257947e92926277a$export$2e2bcd8739ae039).error(`DC#:${this.connectionId} Error when sending:`, e);
      this._buffering = true;
      this.close();
      return false;
    }
    return true;
  }
  // Try to send the first message in the buffer.
  _tryBuffer() {
    if (!this.open) return;
    if (this._buffer.length === 0) return;
    const msg = this._buffer[0];
    if (this._trySend(msg)) {
      this._buffer.shift();
      this._bufferSize = this._buffer.length;
      this._tryBuffer();
    }
  }
  close(options) {
    if (options?.flush) {
      this.send({
        __peerData: {
          type: "close"
        }
      });
      return;
    }
    this._buffer = [];
    this._bufferSize = 0;
    super.close();
  }
  constructor(...args) {
    super(...args), this._buffer = [], this._bufferSize = 0, this._buffering = false;
  }
};
var $9fcfddb3ae148f88$export$f0a5a64d5bb37108 = class extends (0, $a229bedbcaa6ca23$export$ff7c9d4c11d94e8b) {
  close(options) {
    super.close(options);
    this._chunkedData = {};
  }
  constructor(peerId, provider, options) {
    super(peerId, provider, options), this.chunker = new (0, $fcbcc7538a6776d5$export$f1c5f4c9cb95390b)(), this.serialization = (0, $78455e22dea96b8c$export$89f507cf986a947).Binary, this._chunkedData = {};
  }
  // Handles a DataChannel message.
  _handleDataMessage({ data }) {
    const deserializedData = (0, $0cfd7828ad59115f$export$417857010dc9287f)(data);
    const peerData = deserializedData["__peerData"];
    if (peerData) {
      if (peerData.type === "close") {
        this.close();
        return;
      }
      this._handleChunk(deserializedData);
      return;
    }
    this.emit("data", deserializedData);
  }
  _handleChunk(data) {
    const id = data.__peerData;
    const chunkInfo = this._chunkedData[id] || {
      data: [],
      count: 0,
      total: data.total
    };
    chunkInfo.data[data.n] = new Uint8Array(data.data);
    chunkInfo.count++;
    this._chunkedData[id] = chunkInfo;
    if (chunkInfo.total === chunkInfo.count) {
      delete this._chunkedData[id];
      const data2 = (0, $fcbcc7538a6776d5$export$52c89ebcdc4f53f2)(chunkInfo.data);
      this._handleDataMessage({
        data: data2
      });
    }
  }
  _send(data, chunked) {
    const blob = (0, $0cfd7828ad59115f$export$2a703dbb0cb35339)(data);
    if (blob instanceof Promise) return this._send_blob(blob);
    if (!chunked && blob.byteLength > this.chunker.chunkedMTU) {
      this._sendChunks(blob);
      return;
    }
    this._bufferedSend(blob);
  }
  async _send_blob(blobPromise) {
    const blob = await blobPromise;
    if (blob.byteLength > this.chunker.chunkedMTU) {
      this._sendChunks(blob);
      return;
    }
    this._bufferedSend(blob);
  }
  _sendChunks(blob) {
    const blobs = this.chunker.chunk(blob);
    (0, $257947e92926277a$export$2e2bcd8739ae039).log(`DC#${this.connectionId} Try to send ${blobs.length} chunks...`);
    for (const blob2 of blobs) this.send(blob2, true);
  }
};
var $bbaee3f15f714663$export$6f88fe47d32c9c94 = class extends (0, $a229bedbcaa6ca23$export$ff7c9d4c11d94e8b) {
  _handleDataMessage({ data }) {
    super.emit("data", data);
  }
  _send(data, _chunked) {
    this._bufferedSend(data);
  }
  constructor(...args) {
    super(...args), this.serialization = (0, $78455e22dea96b8c$export$89f507cf986a947).None;
  }
};
var $817f931e3f9096cf$export$48880ac635f47186 = class extends (0, $a229bedbcaa6ca23$export$ff7c9d4c11d94e8b) {
  // Handles a DataChannel message.
  _handleDataMessage({ data }) {
    const deserializedData = this.parse(this.decoder.decode(data));
    const peerData = deserializedData["__peerData"];
    if (peerData && peerData.type === "close") {
      this.close();
      return;
    }
    this.emit("data", deserializedData);
  }
  _send(data, _chunked) {
    const encodedData = this.encoder.encode(this.stringify(data));
    if (encodedData.byteLength >= (0, $4f4134156c446392$export$7debb50ef11d5e0b).chunkedMTU) {
      this.emitError((0, $78455e22dea96b8c$export$49ae800c114df41d).MessageToBig, "Message too big for JSON channel");
      return;
    }
    this._bufferedSend(encodedData);
  }
  constructor(...args) {
    super(...args), this.serialization = (0, $78455e22dea96b8c$export$89f507cf986a947).JSON, this.encoder = new TextEncoder(), this.decoder = new TextDecoder(), this.stringify = JSON.stringify, this.parse = JSON.parse;
  }
};
var $416260bce337df90$export$ecd1fc136c422448 = class _$416260bce337df90$export$ecd1fc136c422448 extends (0, $23779d1881157a18$export$6a678e589c8a4542) {
  static #_ = this.DEFAULT_KEY = "peerjs";
  /**
  * The brokering ID of this peer
  *
  * If no ID was specified in {@apilink Peer | the constructor},
  * this will be `undefined` until the {@apilink PeerEvents | `open`} event is emitted.
  */
  get id() {
    return this._id;
  }
  get options() {
    return this._options;
  }
  get open() {
    return this._open;
  }
  /**
  * @internal
  */
  get socket() {
    return this._socket;
  }
  /**
  * A hash of all connections associated with this peer, keyed by the remote peer's ID.
  * @deprecated
  * Return type will change from Object to Map<string,[]>
  */
  get connections() {
    const plainConnections = /* @__PURE__ */ Object.create(null);
    for (const [k, v] of this._connections) plainConnections[k] = v;
    return plainConnections;
  }
  /**
  * true if this peer and all of its connections can no longer be used.
  */
  get destroyed() {
    return this._destroyed;
  }
  /**
  * false if there is an active connection to the PeerServer.
  */
  get disconnected() {
    return this._disconnected;
  }
  constructor(id, options) {
    super(), this._serializers = {
      raw: (0, $bbaee3f15f714663$export$6f88fe47d32c9c94),
      json: (0, $817f931e3f9096cf$export$48880ac635f47186),
      binary: (0, $9fcfddb3ae148f88$export$f0a5a64d5bb37108),
      "binary-utf8": (0, $9fcfddb3ae148f88$export$f0a5a64d5bb37108),
      default: (0, $9fcfddb3ae148f88$export$f0a5a64d5bb37108)
    }, this._id = null, this._lastServerId = null, // States.
    this._destroyed = false, this._disconnected = false, this._open = false, this._connections = /* @__PURE__ */ new Map(), this._lostMessages = /* @__PURE__ */ new Map();
    let userId;
    if (id && id.constructor == Object) options = id;
    else if (id) userId = id.toString();
    options = {
      debug: 0,
      host: (0, $4f4134156c446392$export$7debb50ef11d5e0b).CLOUD_HOST,
      port: (0, $4f4134156c446392$export$7debb50ef11d5e0b).CLOUD_PORT,
      path: "/",
      key: _$416260bce337df90$export$ecd1fc136c422448.DEFAULT_KEY,
      token: (0, $4f4134156c446392$export$7debb50ef11d5e0b).randomToken(),
      config: (0, $4f4134156c446392$export$7debb50ef11d5e0b).defaultConfig,
      referrerPolicy: "strict-origin-when-cross-origin",
      serializers: {},
      ...options
    };
    this._options = options;
    this._serializers = {
      ...this._serializers,
      ...this.options.serializers
    };
    if (this._options.host === "/") this._options.host = window.location.hostname;
    if (this._options.path) {
      if (this._options.path[0] !== "/") this._options.path = "/" + this._options.path;
      if (this._options.path[this._options.path.length - 1] !== "/") this._options.path += "/";
    }
    if (this._options.secure === void 0 && this._options.host !== (0, $4f4134156c446392$export$7debb50ef11d5e0b).CLOUD_HOST) this._options.secure = (0, $4f4134156c446392$export$7debb50ef11d5e0b).isSecure();
    else if (this._options.host == (0, $4f4134156c446392$export$7debb50ef11d5e0b).CLOUD_HOST) this._options.secure = true;
    if (this._options.logFunction) (0, $257947e92926277a$export$2e2bcd8739ae039).setLogFunction(this._options.logFunction);
    (0, $257947e92926277a$export$2e2bcd8739ae039).logLevel = this._options.debug || 0;
    this._api = new (0, $abf266641927cd89$export$2c4e825dc9120f87)(options);
    this._socket = this._createServerConnection();
    if (!(0, $4f4134156c446392$export$7debb50ef11d5e0b).supports.audioVideo && !(0, $4f4134156c446392$export$7debb50ef11d5e0b).supports.data) {
      this._delayedAbort((0, $78455e22dea96b8c$export$9547aaa2e39030ff).BrowserIncompatible, "The current browser does not support WebRTC");
      return;
    }
    if (!!userId && !(0, $4f4134156c446392$export$7debb50ef11d5e0b).validateId(userId)) {
      this._delayedAbort((0, $78455e22dea96b8c$export$9547aaa2e39030ff).InvalidID, `ID "${userId}" is invalid`);
      return;
    }
    if (userId) this._initialize(userId);
    else this._api.retrieveId().then((id2) => this._initialize(id2)).catch((error) => this._abort((0, $78455e22dea96b8c$export$9547aaa2e39030ff).ServerError, error));
  }
  _createServerConnection() {
    const socket = new (0, $8f5bfa60836d261d$export$4798917dbf149b79)(this._options.secure, this._options.host, this._options.port, this._options.path, this._options.key, this._options.pingInterval);
    socket.on((0, $78455e22dea96b8c$export$3b5c4a4b6354f023).Message, (data) => {
      this._handleMessage(data);
    });
    socket.on((0, $78455e22dea96b8c$export$3b5c4a4b6354f023).Error, (error) => {
      this._abort((0, $78455e22dea96b8c$export$9547aaa2e39030ff).SocketError, error);
    });
    socket.on((0, $78455e22dea96b8c$export$3b5c4a4b6354f023).Disconnected, () => {
      if (this.disconnected) return;
      this.emitError((0, $78455e22dea96b8c$export$9547aaa2e39030ff).Network, "Lost connection to server.");
      this.disconnect();
    });
    socket.on((0, $78455e22dea96b8c$export$3b5c4a4b6354f023).Close, () => {
      if (this.disconnected) return;
      this._abort((0, $78455e22dea96b8c$export$9547aaa2e39030ff).SocketClosed, "Underlying socket is already closed.");
    });
    return socket;
  }
  /** Initialize a connection with the server. */
  _initialize(id) {
    this._id = id;
    this.socket.start(id, this._options.token);
  }
  /** Handles messages from the server. */
  _handleMessage(message) {
    const type = message.type;
    const payload = message.payload;
    const peerId = message.src;
    switch (type) {
      case (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Open:
        this._lastServerId = this.id;
        this._open = true;
        this.emit("open", this.id);
        break;
      case (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Error:
        this._abort((0, $78455e22dea96b8c$export$9547aaa2e39030ff).ServerError, payload.msg);
        break;
      case (0, $78455e22dea96b8c$export$adb4a1754da6f10d).IdTaken:
        this._abort((0, $78455e22dea96b8c$export$9547aaa2e39030ff).UnavailableID, `ID "${this.id}" is taken`);
        break;
      case (0, $78455e22dea96b8c$export$adb4a1754da6f10d).InvalidKey:
        this._abort((0, $78455e22dea96b8c$export$9547aaa2e39030ff).InvalidKey, `API KEY "${this._options.key}" is invalid`);
        break;
      case (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Leave:
        (0, $257947e92926277a$export$2e2bcd8739ae039).log(`Received leave message from ${peerId}`);
        this._cleanupPeer(peerId);
        this._connections.delete(peerId);
        break;
      case (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Expire:
        this.emitError((0, $78455e22dea96b8c$export$9547aaa2e39030ff).PeerUnavailable, `Could not connect to peer ${peerId}`);
        break;
      case (0, $78455e22dea96b8c$export$adb4a1754da6f10d).Offer: {
        const connectionId = payload.connectionId;
        let connection = this.getConnection(peerId, connectionId);
        if (connection) {
          connection.close();
          (0, $257947e92926277a$export$2e2bcd8739ae039).warn(`Offer received for existing Connection ID:${connectionId}`);
        }
        if (payload.type === (0, $78455e22dea96b8c$export$3157d57b4135e3bc).Media) {
          const mediaConnection = new (0, $5c1d08c7c57da9a3$export$4a84e95a2324ac29)(peerId, this, {
            connectionId,
            _payload: payload,
            metadata: payload.metadata
          });
          connection = mediaConnection;
          this._addConnection(peerId, connection);
          this.emit("call", mediaConnection);
        } else if (payload.type === (0, $78455e22dea96b8c$export$3157d57b4135e3bc).Data) {
          const dataConnection = new this._serializers[payload.serialization](peerId, this, {
            connectionId,
            _payload: payload,
            metadata: payload.metadata,
            label: payload.label,
            serialization: payload.serialization,
            reliable: payload.reliable
          });
          connection = dataConnection;
          this._addConnection(peerId, connection);
          this.emit("connection", dataConnection);
        } else {
          (0, $257947e92926277a$export$2e2bcd8739ae039).warn(`Received malformed connection type:${payload.type}`);
          return;
        }
        const messages = this._getMessages(connectionId);
        for (const message2 of messages) connection.handleMessage(message2);
        break;
      }
      default: {
        if (!payload) {
          (0, $257947e92926277a$export$2e2bcd8739ae039).warn(`You received a malformed message from ${peerId} of type ${type}`);
          return;
        }
        const connectionId = payload.connectionId;
        const connection = this.getConnection(peerId, connectionId);
        if (connection && connection.peerConnection)
          connection.handleMessage(message);
        else if (connectionId)
          this._storeMessage(connectionId, message);
        else (0, $257947e92926277a$export$2e2bcd8739ae039).warn("You received an unrecognized message:", message);
        break;
      }
    }
  }
  /** Stores messages without a set up connection, to be claimed later. */
  _storeMessage(connectionId, message) {
    if (!this._lostMessages.has(connectionId)) this._lostMessages.set(connectionId, []);
    this._lostMessages.get(connectionId).push(message);
  }
  /**
  * Retrieve messages from lost message store
  * @internal
  */
  //TODO Change it to private
  _getMessages(connectionId) {
    const messages = this._lostMessages.get(connectionId);
    if (messages) {
      this._lostMessages.delete(connectionId);
      return messages;
    }
    return [];
  }
  /**
  * Connects to the remote peer specified by id and returns a data connection.
  * @param peer The brokering ID of the remote peer (their {@apilink Peer.id}).
  * @param options for specifying details about Peer Connection
  */
  connect(peer, options = {}) {
    options = {
      serialization: "default",
      ...options
    };
    if (this.disconnected) {
      (0, $257947e92926277a$export$2e2bcd8739ae039).warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect, or call reconnect on this peer if you believe its ID to still be available.");
      this.emitError((0, $78455e22dea96b8c$export$9547aaa2e39030ff).Disconnected, "Cannot connect to new Peer after disconnecting from server.");
      return;
    }
    const dataConnection = new this._serializers[options.serialization](peer, this, options);
    this._addConnection(peer, dataConnection);
    return dataConnection;
  }
  /**
  * Calls the remote peer specified by id and returns a media connection.
  * @param peer The brokering ID of the remote peer (their peer.id).
  * @param stream The caller's media stream
  * @param options Metadata associated with the connection, passed in by whoever initiated the connection.
  */
  call(peer, stream, options = {}) {
    if (this.disconnected) {
      (0, $257947e92926277a$export$2e2bcd8739ae039).warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect.");
      this.emitError((0, $78455e22dea96b8c$export$9547aaa2e39030ff).Disconnected, "Cannot connect to new Peer after disconnecting from server.");
      return;
    }
    if (!stream) {
      (0, $257947e92926277a$export$2e2bcd8739ae039).error("To call a peer, you must provide a stream from your browser's `getUserMedia`.");
      return;
    }
    const mediaConnection = new (0, $5c1d08c7c57da9a3$export$4a84e95a2324ac29)(peer, this, {
      ...options,
      _stream: stream
    });
    this._addConnection(peer, mediaConnection);
    return mediaConnection;
  }
  /** Add a data/media connection to this peer. */
  _addConnection(peerId, connection) {
    (0, $257947e92926277a$export$2e2bcd8739ae039).log(`add connection ${connection.type}:${connection.connectionId} to peerId:${peerId}`);
    if (!this._connections.has(peerId)) this._connections.set(peerId, []);
    this._connections.get(peerId).push(connection);
  }
  //TODO should be private
  _removeConnection(connection) {
    const connections = this._connections.get(connection.peer);
    if (connections) {
      const index = connections.indexOf(connection);
      if (index !== -1) connections.splice(index, 1);
    }
    this._lostMessages.delete(connection.connectionId);
  }
  /** Retrieve a data/media connection for this peer. */
  getConnection(peerId, connectionId) {
    const connections = this._connections.get(peerId);
    if (!connections) return null;
    for (const connection of connections) {
      if (connection.connectionId === connectionId) return connection;
    }
    return null;
  }
  _delayedAbort(type, message) {
    setTimeout(() => {
      this._abort(type, message);
    }, 0);
  }
  /**
  * Emits an error message and destroys the Peer.
  * The Peer is not destroyed if it's in a disconnected state, in which case
  * it retains its disconnected state and its existing connections.
  */
  _abort(type, message) {
    (0, $257947e92926277a$export$2e2bcd8739ae039).error("Aborting!");
    this.emitError(type, message);
    if (!this._lastServerId) this.destroy();
    else this.disconnect();
  }
  /**
  * Destroys the Peer: closes all active connections as well as the connection
  * to the server.
  *
  * :::caution
  * This cannot be undone; the respective peer object will no longer be able
  * to create or receive any connections, its ID will be forfeited on the server,
  * and all of its data and media connections will be closed.
  * :::
  */
  destroy() {
    if (this.destroyed) return;
    (0, $257947e92926277a$export$2e2bcd8739ae039).log(`Destroy peer with ID:${this.id}`);
    this.disconnect();
    this._cleanup();
    this._destroyed = true;
    this.emit("close");
  }
  /** Disconnects every connection on this peer. */
  _cleanup() {
    for (const peerId of this._connections.keys()) {
      this._cleanupPeer(peerId);
      this._connections.delete(peerId);
    }
    this.socket.removeAllListeners();
  }
  /** Closes all connections to this peer. */
  _cleanupPeer(peerId) {
    const connections = this._connections.get(peerId);
    if (!connections) return;
    for (const connection of connections) connection.close();
  }
  /**
  * Disconnects the Peer's connection to the PeerServer. Does not close any
  *  active connections.
  * Warning: The peer can no longer create or accept connections after being
  *  disconnected. It also cannot reconnect to the server.
  */
  disconnect() {
    if (this.disconnected) return;
    const currentId = this.id;
    (0, $257947e92926277a$export$2e2bcd8739ae039).log(`Disconnect peer with ID:${currentId}`);
    this._disconnected = true;
    this._open = false;
    this.socket.close();
    this._lastServerId = currentId;
    this._id = null;
    this.emit("disconnected", currentId);
  }
  /** Attempts to reconnect with the same ID.
  *
  * Only {@apilink Peer.disconnect | disconnected peers} can be reconnected.
  * Destroyed peers cannot be reconnected.
  * If the connection fails (as an example, if the peer's old ID is now taken),
  * the peer's existing connections will not close, but any associated errors events will fire.
  */
  reconnect() {
    if (this.disconnected && !this.destroyed) {
      (0, $257947e92926277a$export$2e2bcd8739ae039).log(`Attempting reconnection to server with ID ${this._lastServerId}`);
      this._disconnected = false;
      this._initialize(this._lastServerId);
    } else if (this.destroyed) throw new Error("This peer cannot reconnect to the server. It has already been destroyed.");
    else if (!this.disconnected && !this.open)
      (0, $257947e92926277a$export$2e2bcd8739ae039).error("In a hurry? We're still trying to make the initial connection!");
    else throw new Error(`Peer ${this.id} cannot reconnect because it is not disconnected from the server!`);
  }
  /**
  * Get a list of available peer IDs. If you're running your own server, you'll
  * want to set allow_discovery: true in the PeerServer options. If you're using
  * the cloud server, email team@peerjs.com to get the functionality enabled for
  * your key.
  */
  listAllPeers(cb = (_) => {
  }) {
    this._api.listAllPeers().then((peers) => cb(peers)).catch((error) => this._abort((0, $78455e22dea96b8c$export$9547aaa2e39030ff).ServerError, error));
  }
};
var $dd0187d7f28e386f$export$2e2bcd8739ae039 = (0, $416260bce337df90$export$ecd1fc136c422448);

// src/PeerConnectionManager.ts
var PeerConnectionManager = class {
  peerConnectionStatus = "Waiting";
  serverConnection;
  peerjs;
  p2pConnection = null;
  role;
  clientId;
  serverStreamController = null;
  serverStream;
  peerStreamController = null;
  peerStream;
  constructor() {
    this.serverStream = new ReadableStream({
      start: (controller) => {
        this.serverStreamController = controller;
      }
    });
    this.peerStream = new ReadableStream({
      start: (controller) => {
        this.peerStreamController = controller;
      }
    });
  }
  async connect() {
    this.serverConnection = new WebSocket("wss://flashes-server-d5z5.shuttle.app/ws");
    const joinMessage = {
      type: "ClientJoined" /* ClientJoined */
    };
    return new Promise((resolve, reject) => {
      this.serverConnection.onopen = () => {
        this.serverConnection.send(JSON.stringify(joinMessage));
        resolve();
      };
      this.serverConnection.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        if (this.serverStreamController) {
          this.serverStreamController.enqueue({
            ...message
          });
        }
        switch (message.type) {
          case "ClientAcknowledged" /* ClientAcknowledged */:
            this.clientId = message.clientId;
            this.role = message.role;
            break;
          case "PeerJoined" /* PeerJoined */:
            if (this.role === "Player") this.peerConnectionStatus = "Connected";
            await this.initializePeerConnection(message.peerId);
            break;
        }
      };
      this.serverConnection.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };
      this.serverConnection.onclose = () => {
        if (this.serverStreamController) {
          this.serverStreamController.close();
        }
      };
    });
  }
  // closes the connection to the server
  // ideally after P2P connection with the peer has been established
  closeServerConnection() {
    this.serverStreamController?.close();
    this.serverStream.cancel();
    this.serverStreamController = null;
  }
  // this should happen after receiving PeerJoinedEvent
  async initializePeerConnection(peerIdToConnect) {
    if (!this.clientId) throw new Error("No clientId exists, cannot proceed");
    this.peerjs = new $dd0187d7f28e386f$export$2e2bcd8739ae039(this.clientId, {
      config: {
        iceServers: [
          {
            urls: "stun:stun.relay.metered.ca:80"
          }
        ]
      }
    });
    this.peerjs.on("open", () => {
      if (this.peerjs && this.role === "Player" /* Player */ && peerIdToConnect) {
        this.p2pConnection = this.peerjs.connect(peerIdToConnect);
        this.setupDataConnectionEventHandlers(this.p2pConnection);
      }
      this.peerConnectionStatus = "Waiting";
    });
    this.peerjs.on("connection", (conn) => {
      if (this.role === "Spectator" /* Spectator */) {
        this.p2pConnection = conn;
        this.setupDataConnectionEventHandlers(conn);
      }
    });
  }
  // setup data connection
  // Player: happens when server notifies of PeerJoined
  // Spectator: happens when Peer sends data
  setupDataConnectionEventHandlers(dataConnection) {
    dataConnection.on("open", () => {
    });
    dataConnection.on("data", (data) => {
      if (this.peerStreamController) {
        this.peerConnectionStatus = "Connected";
        this.peerStreamController.enqueue({
          ...data
        });
      }
    });
    dataConnection.on("close", () => {
      this.peerConnectionStatus = "Disconnected";
      this.p2pConnection = null;
    });
    dataConnection.on("error", (error) => {
      console.error("P2P connection error:", error);
      this.peerConnectionStatus = "Disconnected";
      this.p2pConnection = null;
    });
  }
  sendToPeer(message) {
    if (!this.p2pConnection?.open) return;
    this.p2pConnection.send(message);
  }
};

// src/storage.ts
var StorageKeysEnum = {
  ANNOUNCEMENT: "announcement",
  MAP: "map"
};
var setStorage = (key, value) => {
  if (value) {
    localStorage.setItem(key, value);
  } else {
    localStorage.removeItem(key);
  }
};
var getStorage = (key) => {
  return localStorage.getItem(key);
};

// src/announcements.ts
var AnnouncementsEnum = {
  Opening: "opening",
  Surroundings: "surroundings",
  None: "none"
};
var ORDERED_ANNOUNCEMENTS = [
  AnnouncementsEnum.Opening,
  AnnouncementsEnum.Surroundings,
  AnnouncementsEnum.None
];
var getAnnouncement = () => {
  return getStorage(StorageKeysEnum.ANNOUNCEMENT);
};
var setAnnouncement = (announcement) => {
  setStorage(StorageKeysEnum.ANNOUNCEMENT, announcement);
};
var initializeAnnouncements = () => {
  const currentAnnouncement = getAnnouncement();
  if (!currentAnnouncement) {
    setAnnouncement(AnnouncementsEnum.Opening);
  }
};
var advanceAnnouncements = () => {
  const currentAnnouncement = getStorage(StorageKeysEnum.ANNOUNCEMENT);
  const announcementIdx = ORDERED_ANNOUNCEMENTS.findIndex((a) => a === currentAnnouncement) || 0;
  const nextAnnouncementIdx = Math.min(
    announcementIdx + 1,
    ORDERED_ANNOUNCEMENTS.length - 1
  );
  const nextAnnouncement = ORDERED_ANNOUNCEMENTS[nextAnnouncementIdx];
  setStorage(
    StorageKeysEnum.ANNOUNCEMENT,
    nextAnnouncement || AnnouncementsEnum.None
  );
};
var announcementFactory = (sentences) => {
  let isInitialized = false;
  let sentenceIdx = 0;
  let isReadyToAdvance = false;
  let charIdx = 0;
  const getNextSentence = () => {
    charIdx = 0;
    sentenceIdx = isReadyToAdvance ? Math.min(sentenceIdx + 1, sentences.length - 1) : sentenceIdx;
    if (!isInitialized) {
      isInitialized = true;
    } else {
      isReadyToAdvance = !isReadyToAdvance;
    }
    return {
      isDone: sentenceIdx === sentences.length - 1
    };
  };
  const getStreamingSentence = () => {
    const sentence = sentences[sentenceIdx] || "";
    charIdx = isReadyToAdvance ? sentence.length : Math.min(charIdx + 1, sentence.length);
    isReadyToAdvance = charIdx >= sentence.length - 1;
    return {
      content: sentence.slice(0, charIdx),
      isSentenceComplete: isReadyToAdvance
    };
  };
  return {
    getNextSentence,
    getStreamingSentence
  };
};

// src/constants.ts
var GLYPHS = ["X", "_", "T", "*", ".", "P", "G", "g"];
var Glyphs = {
  X: {
    displayGlyph: "+",
    cellColor: {
      hue: 251,
      saturation: 20,
      luminosity: 67,
      alpha: 80
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 85,
      alpha: 100
    }
  },
  _: {
    displayGlyph: " ",
    cellColor: {
      hue: 211,
      saturation: 76,
      luminosity: 67,
      alpha: 0
    },
    cellBackground: {
      hue: 211,
      saturation: 76,
      luminosity: 67,
      alpha: 100
    }
  },
  T: {
    displayGlyph: "\u2663",
    cellColor: {
      hue: 0,
      saturation: 0,
      luminosity: 0,
      alpha: 100
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 38,
      alpha: 100
    }
  },
  "*": {
    displayGlyph: " ",
    cellColor: {
      hue: 0,
      saturation: 0,
      luminosity: 59,
      alpha: 100
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 59,
      alpha: 100
    }
  },
  ".": {
    displayGlyph: ".",
    cellColor: {
      hue: 0,
      saturation: 0,
      luminosity: 55,
      alpha: 0
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 55,
      alpha: 100
    }
  },
  P: {
    displayGlyph: "@",
    cellColor: {
      hue: 44,
      saturation: 96,
      luminosity: 45,
      alpha: 100
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 55,
      alpha: 100
    }
  },
  G: {
    displayGlyph: "G",
    cellColor: {
      hue: 166,
      saturation: 45,
      luminosity: 49,
      alpha: 80
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 55,
      alpha: 100
    }
  },
  g: {
    displayGlyph: "g",
    cellColor: {
      hue: 0,
      saturation: 0,
      luminosity: 55,
      alpha: 100
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 55,
      alpha: 100
    }
  }
};
var HIDDEN_GLYPHS = ["."];
var PLAYER_GLYPH = "P";
var MONSTER_GLYPH = "G";
var DEFEATED_MONSTER_GLYPH = "g";
var FlashlightGlyphs = {
  Off: "\u2727",
  On: "\u2726"
};
var GRID_CELL_WIDTH = 40;
var DEFAULT_CAMERA_WIDTH = 12;
var Trauma = {
  TraumaL: "traumaL",
  TraumaR: "traumaR",
  TraumaU: "traumaU",
  TraumaD: "traumaD",
  None: "None"
};
var Pan = {
  Drama: "zoomRotate",
  None: "None"
};
var TRAUMAS = [
  Trauma.TraumaL,
  Trauma.TraumaR,
  Trauma.TraumaU,
  Trauma.TraumaD
];
var PlayerMove = {
  PlayerMoveL: "moveL",
  PlayerMoveR: "moveR",
  PlayerMoveU: "moveU",
  PlayerMoveD: "moveD",
  None: "None"
};
var MOVE_INPUTS = [
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
  "w",
  "a",
  "s",
  "d"
];
var KEY_DELTA = {
  ArrowUp: [0, -1],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowRight: [1, 0],
  w: [0, -1],
  a: [-1, 0],
  s: [0, 1],
  d: [1, 0]
};
var openingAnnouncements = [
  "You wake up from what seems like a daze",
  "Your ribs hurt if you take a deep breath",
  "The assistance system is unresponsive. You tap the headlamp (\u2727), nothing",
  "You tap it a few more times, it flickers to life.",
  // extra sentence as the dialog closes prematurely
  ""
];
var surroundingsAnnouncements = [
  "The dark clouds shift overhead, you can barely see through the thick canopy",
  "You wonder how long the batteries will last..",
  // extra sentence as the dialog closes prematurely
  ""
];

// src/utils.ts
var keyIs = (key) => (event) => event.key === key;
var curry = (f) => {
  const f1 = (...args) => args.length >= f.length ? f(...args) : (
    // biome-ignore lint/suspicious/noExplicitAny: curry should support everything, will type this later
    (...restArgs) => f1(...[...args, ...restArgs])
  );
  return f1;
};
var compose = (...fns) => fns.reduce((acc, curr) => (arg) => acc(curr(arg)));
var takeContinuousN = (n, ms = 300) => {
  let _count = 0;
  let _resetCountTimer;
  return () => {
    if (++_count >= n) {
      _count = 0;
      window.clearTimeout(_resetCountTimer);
      return true;
    }
    if (_resetCountTimer) window.clearTimeout(_resetCountTimer);
    _resetCountTimer = window.setTimeout(() => {
      _count = 0;
    }, ms);
    return false;
  };
};
var distinctFromPrevious = () => {
  let previousValue = null;
  return (value) => {
    const isDistinct = previousValue !== value;
    previousValue = value;
    return isDistinct;
  };
};
var translateX = curry(
  (distance, { grid1DArray, width }) => {
    const newArray = [];
    for (let start = 0; start < grid1DArray.length; start += width) {
      const row = grid1DArray.slice(start, start + width);
      const offset = (distance % width + width) % width;
      newArray.push(...row.slice(offset), ...row.slice(0, offset));
    }
    return { grid1DArray: newArray, width };
  }
);
var translateY = curry(
  (distance, { grid1DArray, width }) => {
    const height = grid1DArray.length / width;
    const offset = (distance % height + height) % height;
    const rows = [];
    for (let start = 0; start < grid1DArray.length; start += width) {
      rows.push(grid1DArray.slice(start, start + width));
    }
    const newArray = rows.slice(offset).concat(rows.slice(0, offset)).flat();
    return { grid1DArray: newArray, width };
  }
);
var idxToGridPosition = (idx, width) => ({
  x: idx % width,
  y: Math.floor(idx / width)
});
var translateX1 = translateX(1);
var translateY1 = translateY(1);
var translateY1N = translateY(-1);
var keyIsMoveInput = (e) => {
  return MOVE_INPUTS.includes(e.key);
};
var keyIsF = keyIs("f");

// src/getCellDelta.ts
var getCellDelta = (cellAIdx, cellBIdx, mapWidth) => {
  if (cellAIdx < 0) throw new Error("Invalid cellIdx");
  const { x, y } = idxToGridPosition(cellBIdx, mapWidth);
  const destinationPosition = idxToGridPosition(cellAIdx, mapWidth);
  return [destinationPosition.x - x, destinationPosition.y - y];
};

// src/maps.ts
var DEFAULT_MAP_SIZE = 16;
var MapsEnum = {
  Intro: "intro",
  None: "none"
};
var WEATHER = [
  {
    id: 1,
    content: `*.........*....*.........*TT*....*.......*TTTT*.*..*......*TT*.......***...**..**...*TTT**.....**T.*TTTT**........T.*T**....**.......**....*T*.**T........*TTT*.TT....*TT*.*TT*........*TT*...........T.*T*........*T*.............*TTT*.............**.........`,
    width: DEFAULT_MAP_SIZE
  }
];
var RAINFALL = [
  {
    id: 1,
    content: `.......*...............*.*...*...............*.....*..................*..*................*.......*........*.....*.........*....*....*....*.....`,
    width: DEFAULT_CAMERA_WIDTH
  }
];
var getMap = () => {
  return getStorage(StorageKeysEnum.MAP);
};
var setMap = (map) => {
  setStorage(StorageKeysEnum.MAP, map);
};
var initializeMaps = () => {
  const currentMap = getMap();
  if (!currentMap) {
    setMap(MapsEnum.Intro);
  }
};

// src/render.ts
var getFog = (mapState, width) => compose(
  translateX1,
  translateY1
)({ grid1DArray: mapState, width });
var legalMoves = Object.values(KEY_DELTA);
var fogState = [];
var Renderer = class {
  rafTimer;
  mapBuffer;
  mapWidth;
  viewWidth;
  playerCellIdx;
  visibilityState;
  cameraAnimationState = {
    shake: Trauma.None,
    move: Pan.None
  };
  playerAnimationState = {
    isDead: false,
    move: PlayerMove.None,
    trauma: Trauma.None,
    hop: false
  };
  weatherState;
  particleState = [null, null];
  gridContainer = document.getElementById("grid-container");
  maskContainer = document.getElementById("mask-container");
  gameContainer = document.getElementById("game-container");
  particleContainer = document.getElementById("particles");
  overlayContainer = document.getElementById(
    "overlay-container"
  );
  init() {
    if (this.rafTimer) {
      cancelIdleCallback(this.rafTimer);
      this.rafTimer = void 0;
    }
    this.render();
  }
  updateRendererState({
    gameMap,
    visibilityState,
    playerCellIdx,
    particleState,
    playerAnimationState
  }) {
    this.mapBuffer = gameMap.level;
    this.mapWidth = gameMap.width;
    this.viewWidth = gameMap.viewWidth;
    this.playerCellIdx = playerCellIdx;
    this.visibilityState = visibilityState;
    this.particleState = [...particleState];
    this.playerAnimationState = { ...playerAnimationState };
  }
  // compute visibility before calling render
  async render() {
    if (!this.mapBuffer || !this.visibilityState || !this.mapWidth || !this.viewWidth || !this.playerCellIdx) {
      throw new Error("Renderer not initialized properly");
    }
    const visibility = Array.from(this.visibilityState).map(
      (squareDistance) => 1 / (2 + squareDistance)
    );
    const weatherData = WEATHER[0];
    fogState = fogState.length > 0 ? [...fogState] : [
      ...weatherData.content.split("").map((x) => GLYPHS.findIndex((g) => g === x))
    ];
    fogState = [...getFog(fogState, this.mapWidth).grid1DArray];
    this.maskContainer.innerHTML = "";
    this.mapBuffer.forEach((_, cellIdx) => {
      const cell = document.createElement("div");
      cell.classList.add("pointer-none", "cell", "bg-black");
      const cellVisibility = visibility[cellIdx];
      cell.style.opacity = `${1 - Math.min(1, Math.floor(cellVisibility / 0.01)) - 0.05}`;
      this.maskContainer.appendChild(cell);
    });
    this.gridContainer.innerHTML = "";
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.viewWidth}, minmax(0px, 1fr))`;
    this.overlayContainer.style.gridTemplateColumns = `repeat(${this.viewWidth}, minmax(0px, 1fr))`;
    this.maskContainer.style.gridTemplateColumns = `repeat(${this.viewWidth}, minmax(0px, 1fr))`;
    const fragment = document.createDocumentFragment();
    const {
      renderParticleGlyph: renderPlayerDamageGlyph,
      setParticleRenderAnchor: setPlayerDamageAnchor
    } = this.getParticleRenderer();
    const {
      renderParticleGlyph: renderMonsterDamageGlyph,
      setParticleRenderAnchor: setMonsterDamageAnchor
    } = this.getParticleRenderer();
    this.mapBuffer.forEach((glyphIdx, cellIdx) => {
      const cellDelta = getCellDelta(
        cellIdx,
        this.playerCellIdx || 0,
        this.mapWidth || 16
      );
      const currentGlyph = GLYPHS[glyphIdx];
      if (!currentGlyph) return;
      const { displayGlyph, cellBackground, cellColor } = Glyphs[currentGlyph];
      const cell = document.createElement("div");
      const cellVisibility = visibility[cellIdx];
      const cellFog = fogState[cellIdx];
      if (!cellVisibility || !cellFog) return;
      cell.textContent = displayGlyph;
      cell.style.backgroundColor = `        hsla(        ${cellBackground.hue},        ${cellBackground.saturation}%,        ${Math.max(4, (cellVisibility + cellFog / 200) * 100)}%,        ${cellBackground.alpha}%)`;
      cell.style.color = `          hsla(          ${cellColor.hue},          ${cellColor.saturation}%,          ${cellColor.luminosity}%,          ${cellColor.alpha}%)`;
      cell.classList.add("pointer-none", "cell", "base", "relative");
      if (currentGlyph === DEFEATED_MONSTER_GLYPH || currentGlyph === MONSTER_GLYPH) {
        setMonsterDamageAnchor(cell);
      }
      if (currentGlyph === PLAYER_GLYPH) {
        cell.style.color = true ? `          hsla(          ${cellColor.hue},          ${cellColor.saturation}%,          ${cellColor.luminosity}%,          ${cellColor.alpha}%)` : "HSL(0, 0%, 63%)";
        const charSpan = document.createElement("span");
        cell.textContent = "";
        charSpan.textContent = displayGlyph;
        charSpan.classList.add("glyph");
        if (this.playerAnimationState.trauma !== Trauma.None) {
          charSpan.classList.add(this.playerAnimationState.trauma);
        }
        if (this.playerAnimationState.move !== Trauma.None) {
          charSpan.classList.add(this.playerAnimationState.move);
        }
        if (this.playerAnimationState.hop) {
          charSpan.classList.add("hop");
        }
        cell.appendChild(charSpan);
        setPlayerDamageAnchor(cell);
      }
      if (cellDelta && legalMoves.some(
        (legalDelta) => legalDelta[0] === cellDelta[0] && legalDelta[1] === cellDelta[1]
      )) {
        cell.classList.remove("pointer-none");
      }
      if (HIDDEN_GLYPHS.includes(displayGlyph)) {
        cell.classList.add("text-transparent");
      }
      cell.dataset.idx = `${cellIdx}`;
      fragment.appendChild(cell);
    });
    this.gridContainer.appendChild(fragment);
    if (this.particleState[0])
      renderPlayerDamageGlyph(`${this.particleState[0]}`);
    if (this.particleState[1])
      renderMonsterDamageGlyph(`${this.particleState[1]}`);
    if (this.cameraAnimationState.shake !== Trauma.None) {
      this.gameContainer.classList.add(this.cameraAnimationState.shake);
      i.fromTimer(100).subscribe({
        next: () => {
          this.gameContainer.classList.remove(...TRAUMAS);
        },
        complete: () => {
        }
      });
    }
  }
  getParticleRenderer = () => {
    let particleSource;
    const particleEl = document.createElement("span");
    particleEl.classList.add("absolute", "color-warning", "hidden");
    this.particleContainer.appendChild(particleEl);
    return {
      renderParticleGlyph: (textContent) => {
        const particleClientRect = particleSource.getBoundingClientRect();
        const leftOffset = particleClientRect.height === GRID_CELL_WIDTH ? particleClientRect.height / 4 : 0;
        particleEl.textContent = textContent;
        particleEl.style.left = `${particleClientRect.left + leftOffset}px`;
        particleEl.style.top = `${particleClientRect.top - particleClientRect.height / 2}px`;
        particleEl.classList.add("floatFade");
        particleEl.classList.remove("hidden");
        i.fromTimer(200).subscribe({
          next: () => {
            particleEl.classList.remove("floatFade");
            particleEl.classList.add("hidden");
          },
          complete: () => {
          }
        });
      },
      setParticleRenderAnchor: (cell) => {
        particleSource = cell;
      }
    };
  };
};

// src/state.ts
initializeAnnouncements();
initializeMaps();
var GameState = class _GameState {
  connectionManager;
  role = "Spectator";
  map;
  flashlight;
  renderer = new Renderer();
  gameState = {
    isGameOver: false
  };
  monsterState = {
    poise: 120
  };
  cameraState = {
    shake: Trauma.None,
    move: Pan.None
  };
  playerState = {
    poise: 100,
    move: PlayerMove.None,
    trauma: Trauma.None,
    isFlashlightOn: getStorage(StorageKeysEnum.ANNOUNCEMENT) === AnnouncementsEnum.None,
    hop: false
  };
  uiState = {
    isInitialized: false,
    showUI: true,
    roleTab: document.getElementById("role-tab"),
    playableContainer: document.getElementById(
      "playable-container"
    ),
    playButtonContainer: document.getElementById(
      "play-button-container"
    ),
    playButtonEl: document.getElementById("play-button"),
    buttonsContainer: document.getElementById(
      "buttons-container"
    ),
    restartContainer: document.getElementById(
      "restart-container"
    ),
    flashlightButtonEl: document.getElementById("flashlight"),
    particleContainer: document.getElementById("particles"),
    gameContainer: document.getElementById("game-container"),
    gridContainer: document.getElementById("grid-container"),
    overlayContainer: document.getElementById(
      "overlay-container"
    ),
    maskContainer: document.getElementById("mask-container"),
    dPad: document.getElementById("d-pad"),
    announcementTarget: document.getElementById("announcement")
  };
  weather = WEATHER[0];
  rain = RAINFALL[0];
  pendingInitialStateVector = null;
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
  }
  static async init() {
    const connectionManager = new PeerConnectionManager();
    await connectionManager.connect();
    const instance2 = new _GameState(connectionManager);
    instance2.setupEventHandlers();
    i.eagerFromReadableStream(
      instance2.connectionManager.serverStream
    ).subscribe({
      next: async ({ value }) => {
        instance2.updateConnectionStatusUI();
        switch (value.type) {
          case "ClientAcknowledged" /* ClientAcknowledged */: {
            instance2.role = value.role;
            instance2.map = value.map;
            break;
          }
          case "PeerJoined" /* PeerJoined */: {
            instance2.connectionManager.closeServerConnection();
            break;
          }
          default:
            console.warn("Unexpected message type");
        }
      },
      complete: () => {
      }
    });
    i.eagerFromReadableStream(
      instance2.connectionManager.peerStream
    ).subscribe({
      next: async ({ value }) => {
        instance2.updateConnectionStatusUI();
        switch (value.type) {
          case "InitialStateVector" /* InitialStateVector */: {
            if (instance2.role === "Player") break;
            instance2.pendingInitialStateVector = value.data;
            break;
          }
          case "Delta" /* Delta */: {
            instance2.flashlight?.apply_delta_js(new Uint8Array(value.data));
            instance2.tick();
            break;
          }
          default:
            console.warn("Unexpected message type");
        }
      },
      complete: () => {
      }
    });
    return instance2;
  }
  async sendDelta(delta) {
    this.connectionManager.sendToPeer({
      type: "Delta" /* Delta */,
      data: delta
    });
  }
  async sendInitialStateVector(state) {
    if (this.role === "Spectator") return;
    this.connectionManager.sendToPeer({
      type: "InitialStateVector" /* InitialStateVector */,
      data: state
    });
  }
  async startGame() {
    if (!this.map) {
      return;
    }
    const { level, width, viewWidth, cellWidth } = this.map;
    this.flashlight = Flashlight.new_from_js(
      new Uint8Array(level),
      width,
      cellWidth,
      viewWidth
    );
    if (this.pendingInitialStateVector && this.role === "Spectator") {
      this.flashlight.apply_initial_state_vector_js(
        new Uint8Array(this.pendingInitialStateVector)
      );
      this.pendingInitialStateVector = null;
    }
    this.initRain();
    this.initializeUI();
    await this.tick();
  }
  updateConnectionStatusUI() {
    switch (this.connectionManager.peerConnectionStatus) {
      case "Waiting":
        this.uiState.playButtonEl.textContent = "wait for P2...";
        break;
      case "Connected":
        this.uiState.playButtonEl.textContent = "Play";
        this.uiState.playButtonEl.classList.remove("pointer-none");
        break;
      case "Disconnected":
        this.uiState.playButtonEl.textContent = "Disconnected";
        break;
    }
  }
  setupEventHandlers() {
    const $playButtonInput = i.fromEvent(
      "click",
      this.uiState.playButtonEl
    );
    $playButtonInput.subscribe({
      next: () => {
        this.startGame();
        this.uiState.playButtonContainer.classList.add("opacity-0");
      },
      complete: () => {
      }
    });
    const $keyUpInput = i.fromEvent("keyup", document.body);
    const $keyDownInput = i.fromEvent("keydown", document.body);
    const $dPadInput = i.fromEvent("click", this.uiState.dPad);
    const $cellClick = i.fromEvent("click", this.uiState.gridContainer);
    const $flashlightButtonClick = i.fromEvent(
      "click",
      this.uiState.flashlightButtonEl
    );
    const $tenSecInterval = i.fromInterval(1e4);
    const $moveKeyInput = $keyDownInput.filter(
      (e) => keyIsMoveInput(e)
    );
    const $fKeyInput = $keyUpInput.filter(
      (e) => keyIsF(e)
    );
    $moveKeyInput.filter(() => {
      return this.role !== "Spectator";
    }).map((e) => {
      e.preventDefault();
      const delta = KEY_DELTA[e.key];
      if (!delta) throw new Error("Failed to find move delta");
      return { delta };
    }).subscribe({
      next: this.moveWithDelta,
      complete: () => {
      }
    });
    $dPadInput.filter(() => {
      return this.role !== "Spectator";
    }).map((e) => {
      e.preventDefault();
      const ariaLabel = e.target.getAttribute("aria-label");
      if (!ariaLabel) throw new Error("No aria label found");
      const delta = KEY_DELTA[ariaLabel];
      return { delta };
    }).subscribe({
      next: this.moveWithDelta,
      complete: () => {
      }
    });
    $cellClick.filter(() => {
      return this.role !== "Spectator";
    }).filter((e) => {
      const target = e.target;
      return target.classList.contains("cell");
    }).map((e) => {
      e.preventDefault();
      const target = e.target;
      const cellIdx = target.dataset.idx;
      if (!cellIdx) throw new Error("Failed to find cell idx");
      return { cellIdx: Number.parseInt(cellIdx) };
    }).subscribe({
      next: this.selectCell,
      complete: () => {
      }
    });
    const {
      getNextSentence: getNextOpeningSentence,
      getStreamingSentence: getStreamingOpeningSentence
    } = announcementFactory(openingAnnouncements);
    const {
      getNextSentence: getNextSurroundingsSentence,
      getStreamingSentence: getStreamingSurroundingsSentence
    } = announcementFactory(surroundingsAnnouncements);
    const $notFKeyInput = i.fromEvent("keyup", document.body).filter(
      (e) => !keyIsF(e)
    );
    const $anyClick = i.fromEvent("click", document.body);
    const openingDialogUnsub = $notFKeyInput.withLatestFrom($anyClick).filter(
      () => getAnnouncement() === AnnouncementsEnum.Opening && !this.playerState.isFlashlightOn
    ).switchMap(() => {
      const { isDone } = getNextOpeningSentence();
      return i.fromInterval(60).map(() => {
        const { content, isSentenceComplete } = getStreamingOpeningSentence();
        return {
          content,
          isDone: isDone && isSentenceComplete
        };
      });
    }).filter(({ content }) => distinctFromPrevious()(content)).subscribe({
      next: ({ isDone, content }) => {
        this.uiState.announcementTarget.classList.add(
          "opacity-transition-fast"
        );
        this.uiState.announcementTarget.classList.remove(
          "opacity-0",
          "opacity-transition-faster"
        );
        this.uiState.announcementTarget.textContent = content;
        if (isDone) {
          this.uiState.announcementTarget.classList.add(
            "opacity-0",
            "opacity-transition-faster"
          );
          openingDialogUnsub();
          advanceAnnouncements();
        }
      },
      complete: () => {
      }
    });
    const $notFKey = i.fromEvent("keyup", document.body).filter(
      (e) => !keyIsF(e)
    );
    const $anyClick2 = i.fromEvent("click", document.body);
    const surroundingsDialogUnsub = $notFKey.withLatestFrom($anyClick2).filter(
      () => getAnnouncement() === AnnouncementsEnum.Surroundings && this.playerState.isFlashlightOn
    ).switchMap(() => {
      const { isDone } = getNextSurroundingsSentence();
      return i.fromInterval(60).map(() => {
        const { content, isSentenceComplete } = getStreamingSurroundingsSentence();
        return {
          content,
          isDone: isDone && isSentenceComplete
        };
      });
    }).filter(({ content }) => distinctFromPrevious()(content)).subscribe({
      next: ({ isDone, content }) => {
        this.uiState.announcementTarget.classList.add(
          "opacity-transition-fast"
        );
        this.uiState.announcementTarget.classList.remove(
          "opacity-0",
          "opacity-transition-faster"
        );
        this.uiState.announcementTarget.textContent = content;
        if (isDone) {
          this.uiState.announcementTarget.classList.add("opacity-0");
          surroundingsDialogUnsub();
          advanceAnnouncements();
        }
      },
      complete: () => {
      }
    });
    const flashlightTriggerUnsub = $flashlightButtonClick.withLatestFrom($fKeyInput).filter(takeContinuousN(3)).filter(() => !this.playerState.isFlashlightOn).map(([e1, e2]) => {
      e1?.preventDefault();
      e2?.preventDefault();
      return { value: this.playerState.isFlashlightOn };
    }).subscribe({
      next: async ({ value }) => {
        await this.toggleFlashlight({ value });
        flashlightTriggerUnsub();
        openingDialogUnsub();
      },
      complete: () => {
      }
    });
    $tenSecInterval.subscribe({
      next: (tick) => {
        if (tick % 4) {
          this.uiState.overlayContainer.classList.add(
            "fadeIn",
            "opacity-transition"
          );
        } else {
          this.uiState.overlayContainer.classList.remove("fadeIn");
        }
      },
      complete: () => {
      }
    });
  }
  initializeUI() {
    if (!this.map) {
      return;
    }
    if (this.uiState.isInitialized) {
      return;
    }
    if (this.role === "Spectator") {
      this.uiState.buttonsContainer.classList.add("opacity-0");
      this.uiState.roleTab.classList.remove("opacity-0");
    }
    this.uiState.playableContainer.style.width = `${GRID_CELL_WIDTH * (this.map.viewWidth || DEFAULT_CAMERA_WIDTH)}`;
    this.uiState.gridContainer.style.width = `${GRID_CELL_WIDTH * (this.map.viewWidth || DEFAULT_CAMERA_WIDTH)}`;
    this.uiState.gridContainer.style.gridTemplateColumns = `repeat(${this.map.width}, minmax(0, 1fr))`;
    this.uiState.overlayContainer.style.gridTemplateColumns = `repeat(${this.rain.width}, minmax(0, 1fr))`;
    this.uiState.maskContainer.style.gridTemplateColumns = `repeat(${this.map.width}, minmax(0, 1fr))`;
    const rain = this.rain.content.split("");
    const rainGlyphs = rain.map((glyph) => {
      return glyph === "*" ? "." : " ";
    });
    for (const rainGlyph of rainGlyphs) {
      const cell = document.createElement("div");
      cell.textContent = rainGlyph;
      cell.classList.add("invert", "cell", "pointer-none");
      this.uiState.overlayContainer.appendChild(cell);
    }
    this.initRain();
    this.uiState.isInitialized = true;
  }
  get engine() {
    if (!this.flashlight) {
      throw new Error("Game not initialized");
    }
    return this.flashlight;
  }
  get mapWidth() {
    if (!this.map) {
      throw new Error("Game not initialized");
    }
    return this.map.width;
  }
  // HACK: extract a UI renderer
  setGameOver() {
    if (this.gameState.isGameOver) {
      this.uiState.gameContainer.classList.add(this.cameraState.move);
      this.uiState.buttonsContainer.classList.add("fadeOut");
      this.uiState.restartContainer.classList.add("fadeIn-full");
      this.uiState.restartContainer.classList.remove("pointer-none");
    }
  }
  initRain = () => {
    const overlayContainerRect = this.uiState.overlayContainer.getBoundingClientRect();
    const rainDrops = Array.from(
      this.uiState.overlayContainer.children
    );
    const offsets = [];
    for (const rainDrop of rainDrops) {
      const rect = rainDrop.getBoundingClientRect();
      const relativeTop = -(rect.top - overlayContainerRect.top + rect.height / 2);
      const relativeLeft = overlayContainerRect.left + overlayContainerRect.width - rect.left - rect.width / 2 - // border offset
      2;
      offsets.push({
        x: relativeLeft,
        y: relativeTop,
        maxX: relativeLeft,
        maxY: relativeTop
      });
      rainDrop.style.transform = `translate(${relativeLeft}px, ${relativeTop}px)`;
    }
    const moveRaindrops = () => {
      rainDrops.forEach((rainDrop, idx) => {
        const { x, y, maxX, maxY } = offsets[idx];
        const multiplier = overlayContainerRect.width < 400 ? 1 : 2;
        const updatedX = x > 0 ? x - multiplier : maxX;
        const updatedY = y < 0 ? y + multiplier : maxY;
        offsets[idx] = { x: updatedX, y: updatedY, maxX, maxY };
        rainDrop.style.transform = `translate(${updatedX}px, ${updatedY}px)`;
      });
      requestAnimationFrame(moveRaindrops);
    };
    moveRaindrops();
  };
  /**
   * Selects the cell.
   * @param {object} { cellIdx: number }
   */
  selectCell = async ({ cellIdx }) => {
    if (!cellIdx || !this.map) return;
    const delta = getCellDelta(
      cellIdx,
      this.engine.map_metadata.player_cell_idx,
      this.map.width
    );
    await this.moveWithDelta({ delta });
  };
  moveWithDelta = async ({
    delta
  }) => {
    if (!delta) return;
    const { x, y } = idxToGridPosition(
      this.engine.map_metadata.player_cell_idx,
      this.engine.width
    );
    const gridPosition = { x: x + delta[0], y: y + delta[1] };
    const cell = Vec2.new_with_data(gridPosition.x, gridPosition.y);
    const outcome = this.engine.do_move_player(cell);
    const playerMove = delta[0] < 0 ? PlayerMove.PlayerMoveL : delta[0] > 0 ? PlayerMove.PlayerMoveR : delta[1] < 0 ? PlayerMove.PlayerMoveU : PlayerMove.PlayerMoveD;
    switch (outcome) {
      case MoveOutcome.Rejected: {
        this.playerState.trauma = delta[0] < 0 ? Trauma.TraumaL : delta[0] > 0 ? Trauma.TraumaR : delta[1] < 0 ? Trauma.TraumaU : Trauma.TraumaD;
        this.playerState.hop = false;
        this.playerState.move = PlayerMove.None;
        this.cameraState.shake = this.playerState.trauma;
        break;
      }
      case MoveOutcome.Advance:
        this.cameraState.shake = Trauma.None;
        this.playerState.trauma = Trauma.None;
        this.playerState.hop = true;
        this.playerState.move = playerMove;
        break;
      case MoveOutcome.NoOp:
        this.cameraState.shake = Trauma.None;
        this.playerState.trauma = Trauma.None;
        this.playerState.hop = false;
        break;
      case MoveOutcome.End:
        this.cameraState.shake = Trauma.None;
        this.cameraState.move = Pan.Drama;
        this.playerState.trauma = Trauma.None;
        this.playerState.hop = false;
        this.uiState.showUI = false;
        this.gameState.isGameOver = true;
        break;
    }
    this.engine.do_move_enemy();
    await this.tick();
  };
  async tick() {
    if (!this.map) {
      return;
    }
    this.engine.compute_visibility();
    const mapState = this.engine.get_clipped_map_state();
    this.renderer.updateRendererState({
      gameMap: {
        level: mapState,
        width: this.map.width,
        cellWidth: this.map?.cellWidth,
        viewWidth: this.map?.viewWidth
      },
      visibilityState: Array.from(this.engine.visibility_state),
      particleState: [null, null],
      playerCellIdx: this.engine.map_metadata.player_cell_idx,
      playerAnimationState: {
        ...this.playerState,
        isDead: this.engine.player_poise <= 0
      }
    });
    await this.renderer.render();
  }
  async toggleFlashlight({ value }) {
    this.playerState.isFlashlightOn = !value;
    this.uiState.flashlightButtonEl.textContent = value ? FlashlightGlyphs.Off : FlashlightGlyphs.On;
    this.uiState.flashlightButtonEl.classList.add("pointer-none");
    await this.tick();
  }
};
var gameState = await GameState.init();

// src/globalAPI.ts
window.sendDelta = async (deltaBytes) => {
  gameState.sendDelta(deltaBytes);
};
window.sendInitialStateVector = async (initialStateVector) => {
  gameState.sendInitialStateVector(initialStateVector);
};
