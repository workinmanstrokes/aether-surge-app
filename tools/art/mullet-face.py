# Builds www/assets/mullet-face.png: stylized (posterized, outlined) cutout of Michael's head from his reference photo.
from PIL import Image,ImageFilter,ImageOps,ImageEnhance
import numpy as np
im=Image.open('/workspace/listings/aether-surge/ref/michael-face.png').convert('RGB').resize((576,1024),Image.LANCZOS)
_a=np.array(im);_a[132:334,40:205]=_a[132:334,530-40:530-205:-1]  # replace picture-in-picture inset with mirrored other half of the head
im=Image.fromarray(_a)
a=np.array(im).astype(int);r,g,b=a[...,0],a[...,1],a[...,2]
sky=(b>r+20)&(b>130)
Y,X=np.mgrid[:a.shape[0],:a.shape[1]]
head=((X-262)/150.)**2+((Y-390)/250.)**2<1
mul=(Y>400)&(Y<630)&(X>85)&(X<500)&~((Y>570)&((X<170)|(X>470)))
vest=(g>190)&(r>140)&(b<130)
keep=(((X-265)/140.)**2+((Y-385)/235.)**2<1)&~vest | (mul&(r>g+25)&(r>90)&~sky)
mask=Image.fromarray((keep*255).astype('uint8')).filter(ImageFilter.MedianFilter(11)).filter(ImageFilter.GaussianBlur(1.5))
box=(80,125,505,640);c=im.crop(box);mk=mask.crop(box)
c=ImageEnhance.Color(c).enhance(1.4);c=ImageEnhance.Contrast(c).enhance(1.2);c=c.filter(ImageFilter.SMOOTH_MORE)
c=ImageOps.posterize(c,4).filter(ImageFilter.SMOOTH_MORE)
o=Image.new('RGBA',c.size,(0,0,0,0));o.paste((26,16,40,255),(0,0),mk.filter(ImageFilter.MaxFilter(15)))
c=c.convert('RGBA');c.putalpha(mk);o.alpha_composite(c)
o.resize((120,146),Image.LANCZOS).save('www/assets/mullet-face.png')
