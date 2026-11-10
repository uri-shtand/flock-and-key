"""Build-time Hebrew speech preparation. No child data is sent. Python standard library only."""
import concurrent.futures, json, pathlib, subprocess, urllib.parse
ROOT = pathlib.Path(__file__).resolve().parent.parent

def prepare(word):
    target = ROOT / 'public' / word['audio'].lstrip('/')
    if target.exists() and target.stat().st_size > 1000:
        return
    text = f"{word['text']}. {word['sentence']} כתבו {word['text']}."
    query = urllib.parse.urlencode({'ie':'UTF-8','client':'tw-ob','tl':'iw','q':text})
    temporary = target.with_suffix('.part')
    subprocess.run(['curl','--silent','--show-error','--fail','--retry','3','--max-time','40',
                    'https://translate.google.com/translate_tts?'+query,'-o',str(temporary)],check=True)
    if temporary.stat().st_size < 1000:
        raise ValueError('Empty speech asset: '+word['id'])
    temporary.replace(target)

if __name__ == '__main__':
    words = json.loads((ROOT/'src/content/words.json').read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        list(pool.map(prepare,words))
    print(f'Prepared {len(words)} prerecorded Hebrew files.')
