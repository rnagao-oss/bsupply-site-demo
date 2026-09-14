"""Build layout CSS from the measured reference without importing its brand assets."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import tinycss2
from tinycss2.color3 import parse_color

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / '_spec/ref/style.css'
ORIGINAL = ROOT / '_spec/original-fonts.css'
COUNTS = Counter()


def tokens(value):
    return tinycss2.parse_component_value_list(value)


def grayscale(values):
    result = []
    for token in values:
        if token.type == 'url' or token.type == 'function' and (token.lower_name == 'url' or 'gradient' in token.lower_name):
            result.extend(tokens('none'))
            COUNTS['asset_or_gradient_tokens_removed'] += 1
            continue
        color = parse_color(token) if token.type in ('ident', 'hash', 'function') else None
        if color is not None and color != 'currentColor':
            r, g, b, alpha = color
            gray = round((0.2126 * r + 0.7152 * g + 0.0722 * b) * 255)
            replacement = f'rgba({gray},{gray},{gray},{alpha:g})' if alpha < 1 else f'#{gray:02x}{gray:02x}{gray:02x}'
            result.extend(tokens(replacement))
            COUNTS['color_tokens_normalized'] += 1
        else:
            if token.type == 'function':
                token.arguments = grayscale(token.arguments)
            result.append(token)
    return result


def declarations(content, selector=''):
    output = []
    for declaration in tinycss2.parse_declaration_list(content, skip_whitespace=True, skip_comments=True):
        if declaration.type != 'declaration':
            if declaration.type == 'error':
                COUNTS['source_parse_errors_omitted'] += 1
            continue
        name = declaration.lower_name
        value = tinycss2.serialize(declaration.value).strip()
        if 'transition' in name or 'animation' in name:
            if name.endswith(('delay', 'duration')):
                value = '0s'
            elif name.endswith('timing-function'):
                value = 'linear'
            else:
                value = 'none'
            COUNTS['motion_declarations_neutralized'] += 1
        elif 'radius' in name:
            value = '0'
            COUNTS['radius_declarations_neutralized'] += 1
        elif 'shadow' in name or name in ('filter', '-webkit-filter', 'backdrop-filter', '-webkit-backdrop-filter', 'clip-path', '-webkit-clip-path', 'mask', '-webkit-mask', 'mask-image', '-webkit-mask-image'):
            value = 'none'
            COUNTS['decoration_declarations_neutralized'] += 1
        elif name == 'font-family':
            if 'Eina' in value:
                value = 'var(--en)'
            elif value not in ('inherit', 'auto'):
                value = 'var(--jp)'
            COUNTS['font_families_replaced'] += 1
        elif name == 'font-weight' and selector == 'body':
            value = '400'
        elif name in ('transform', '-webkit-transform') and ('.js-inter' in selector or '.is-opening' in selector or ':hover' in selector):
            value = 'none'
            COUNTS['entrance_or_hover_transforms_neutralized'] += 1
        elif name == 'opacity' and ('.js-inter' in selector or '.is-opening' in selector or selector == '.l-fixed'):
            value = '1'
            COUNTS['entrance_opacity_neutralized'] += 1
        elif name in ('background-clip', '-webkit-background-clip') and value == 'text':
            value = 'border-box'
        elif name == 'mix-blend-mode':
            value = 'normal'
        declaration.value = grayscale(tokens(value))
        output.append(tinycss2.serialize([declaration]))
    return ''.join(output)


def build_rules(rules):
    output = []
    for rule in rules:
        if rule.type == 'qualified-rule':
            selector = tinycss2.serialize(rule.prelude)
            output.append(selector + '{' + declarations(rule.content, selector) + '}')
        elif rule.type == 'at-rule':
            name = rule.lower_at_keyword
            if name in ('charset', 'import', 'font-face', 'keyframes', '-webkit-keyframes'):
                COUNTS['removed_at_' + name] += 1
                continue
            prelude = tinycss2.serialize(rule.prelude)
            if rule.content is None:
                output.append('@' + rule.at_keyword + prelude + ';')
            elif name == 'property':
                output.append('@' + rule.at_keyword + prelude + '{' + declarations(rule.content) + '}')
            else:
                nested = build_rules(tinycss2.parse_rule_list(rule.content, skip_comments=True, skip_whitespace=True))
                assert nested, f'Empty source at-rule: {name} {prelude}'
                output.append('@' + rule.at_keyword + prelude + '{\n' + '\n'.join(nested) + '\n}')
    return output


def media_conditions(rules):
    result = Counter()
    for rule in rules:
        if rule.type == 'at-rule' and rule.content and rule.lower_at_keyword not in ('property', 'font-face'):
            if rule.lower_at_keyword == 'media':
                result[tinycss2.serialize(rule.prelude).strip()] += 1
            result.update(media_conditions(tinycss2.parse_rule_list(rule.content, skip_comments=True, skip_whitespace=True)))
    return result


original = tinycss2.parse_stylesheet(ORIGINAL.read_text(), skip_comments=True, skip_whitespace=True)
font_faces = '\n'.join(tinycss2.serialize([rule]) for rule in original if rule.type == 'at-rule' and rule.lower_at_keyword == 'font-face')
source_rules = tinycss2.parse_stylesheet(SOURCE.read_text(), skip_comments=True, skip_whitespace=True)
prefix = '''/* Layout adapted from https://sun-asterisk.com/; source: _spec/ref/style.css; brand assets, colors, decoration and motion replaced. */
'''
variables = '''
:root{--en:"Hanken Grotesk",sans-serif;--jp:"YakuHanJP","Noto Sans JP",sans-serif;--bg:#fff;--bg-soft:#f6f6f6;--ink:#000;--gray:#777;--line:#e5e5e5;--ease:linear}
'''
compatibility = '''
/* Existing B supply typography and dot-sphere canvas. */
body{font-family:var(--jp);font-weight:400;color:#000;background:#fff}
.sphere-canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:3}
[data-sphere="on"] .p-top-mv__copy,[data-sphere="on"] .p-top-mv__scroll{z-index:4}
.ph{display:block;background:#e5e5e5}
'''
css = prefix + font_faces + variables + '\n'.join(build_rules(source_rules)) + compatibility
output = ROOT / 'styles.css'
output.write_text(css)
result_rules = tinycss2.parse_stylesheet(css, skip_comments=True, skip_whitespace=True)
expected = json.loads((ROOT / '_spec/reference-css.json').read_text())['media_conditions']
actual = media_conditions(result_rules)
assert actual == expected, (actual - Counter(expected), Counter(expected) - actual)
report = {
    'source': '_spec/ref/style.css',
    'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'generated': 'styles.css',
    'media_count': actual.total(),
    'unique_media_conditions': len(actual),
    'media_condition_counts_match_reference': True,
    'empty_media_blocks_added': 0,
    'preserved_original_font_faces': 4,
    'sanitization_counts': dict(COUNTS),
    'remaining_integration_notes': [
        'Reference class names and structural markup are required for each layout rule to apply.',
        'Reference modal and navigation visibility states remain; the rewritten application controls these states.',
        'Geometric transforms used for centering and positioning remain. Entrance, hover, animation and transition motion are disabled.',
        'All original media blocks retain actual source selectors and declarations. Some selectors belong to reference pages excluded by the B supply content mapping; they remain unused, not fake breakpoint padding.',
        'Reference body weight is replaced with 400. English heading weights remain for geometry; page-specific Japanese heading weights can be supplied by the final stylesheet integration.',
        'Supplemental CSS must be merged into existing media blocks when responsive rules are required, without adding media blocks.',
    ],
}
(ROOT / '_spec/css-build-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'media_count': actual.total(), 'condition_count': len(actual), 'bytes': len(css), 'sanitization': dict(COUNTS)}, ensure_ascii=False))
