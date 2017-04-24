from PIL import Image
import itertools

def chunk(n, iterable):
    it = iter(iterable)
    while True:
       chunk = list(itertools.islice(it, n))
       if not chunk:
           return
       yield chunk

def rle_encode(filename):
  im = Image.open('test.bmp')
  im.convert('1')
  width, height = im.size

  curColor = 0
  count = 0

  for i in range(width*height):
    (r, g, b) = im.getpixel((i / width, i % width))
    color = (-1 if r == 0 else 1)

    # new image
    if curColor == 0:
      curColor = color

    # color change
    if color != curColor:
      yield count * curColor
      count = 1
    else:
      count += 1

    # size overflow
    if(count >= 127):
      yield count * curColor
      count = 0

    curColor = color

def generate_packets(filename):
  for data in chunk(16, rle_encode(filename)):
    sb = '\x02'
    sb += ''.join(map(lambda c: chr(c % 255), data))
    sb += '\x00'
    yield sb

if __name__ == "__main__":
  for p in generate_packets('test.bmp'):
    print p
