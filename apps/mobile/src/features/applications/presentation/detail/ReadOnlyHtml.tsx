import { createElement } from 'react';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

export function ReadOnlyHtml({ html }: { html: string }) {
  if (Platform.OS === 'web') {
    return createElement('div', {
      className: 'palea-description',
      dangerouslySetInnerHTML: { __html: html },
    });
  }
  return (
    <View style={{ minHeight: 96 }}>
      <WebView
        originWhitelist={['about:blank']}
        source={{
          html: `<meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:-apple-system,system-ui;color:#282522;font-size:16px;line-height:1.5;padding:0;margin:0}h1{font-size:24px}h2{font-size:20px}h3{font-size:17px}a{color:#4238a8}</style>${html}`,
        }}
        scrollEnabled={false}
        style={{ backgroundColor: 'transparent', minHeight: 96 }}
      />
    </View>
  );
}
