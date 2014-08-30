SRCDIR = coffee/common
OUTDIR = public/test
CLIENTDIR = client
SERVERDIR = server
CLASSES := $(shell echo $$(cat $(SRCDIR)/hierarchy))

#.PHONY: doc
#doc:
#	# ↓--join は coffee に任せる。個別に js をロードしてもエラーになるため。
#	coffee --join $(OUTDIR)/app.js --compile $(foreach c,$(CLASSES),$(SRCDIR)/$(c).coffee)
#	# ↓ドキュメント生成用の個別 js ファイル生成
#	coffee --compile $(foreach c,$(CLASSES),$(SRCDIR)/$(c).coffee)
#	jsduck -o public/doc --builtin-classes $(SRCDIR)/*.js
#	cp $(SRCDIR)/*.html public/test/
#	# jsduck -o public/doc --builtin-classes common/*.js server/*.js client/*.js coffee/common/*.js

default: doc

# CoffeeScript concatenate
$(SRCDIR)/.app.coffee: $(foreach c,$(CLASSES),$(SRCDIR)/$(c).coffee)
	cat $^ > $@ || (rm -f $@; false)

# JavaScript compile
$(CLIENTDIR)/app.js: $(SRCDIR)/.app.coffee
	cpp -E -Xpreprocessor -DCLIENT -D_SIDE_=Client $< | coffee --compile --stdio --output $@

$(SERVERDIR)/app.js: $(SRCDIR)/.app.coffee
	cpp -E -Xpreprocessor -DSERVER -D_SIDE_=Server $< | coffee --compile --stdio --output $@

# Document generation
doc:
	jsduck -o public/doc --builtin-classes $(CLIENTDIR)/app.js $(SERVERDIR)/app.js

#doc2:
#	cat $(SRCDIR)/*.coffee > public/test/app.js
#	coffee --compile public/test/app.js
#	jsduck -o public/doc2 --builtin-classes public/test/app.js

