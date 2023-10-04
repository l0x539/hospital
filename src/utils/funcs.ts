export default function glslifyStrip(snippet: string) {
	return snippet.replace(/#define\sGLSLIFY\s./, '')
}