(function (window, document, $)
{	
    function supportTransitions()
    {
        var b = document.body || document.documentElement,
            s = b.style,
            p = 'transition';

        if (typeof s[p] == 'string') 
        {
            this.animationPrefix = p;
            return true; 
        }

        var v = ['Moz', 'webkit', 'Webkit', 'Khtml', 'O', 'ms'];
        p = p.charAt(0).toUpperCase() + p.substr(1);

        for (var i = 0; i < v.length; i++) 
        {
            if (typeof s[v[i] + p] == 'string')
            {   
                this.animationPrefix = v[i];
                return true;
            }
        }

        return false;        
    }

	// ==================================================================================================================
    // Carousel Constructor
    // ==================================================================================================================

	function Carousel (el, options)
	{
		this.el  = el;
		this.$el = $(el);

        this.options = $.extend({}, this.defaultOptions, options, this.$el.data());

		this.wrap              = this.$el.find('> ul');
        this.preLoadCounter    = 0;
		this.slides            = this.wrap.find('> li');
		this.width             = this.$el.width();
		this.inProgress        = false;
        this.supportTransition = supportTransitions.call(this);
        this.interval          = null;

		this._init();
	}

	// ==================================================================================================================
    // Carousel Prototype Methods/Properties
    // ==================================================================================================================

	// =========================================================
	// Version

	Carousel.prototype.Version = 1.0;

	// =========================================================
	// Default Options

	Carousel.prototype.defaultOptions =
	{
        animation             : 'slide',
        controls              : true,
        pagination            : true,
        keyControls           : true,
        captions              : false,
        responsive            : true,
        infinite              : true,
        startSlide            : null,
        useCss                : true,

        drag                  : true,

        preLoad               : true,
        preLoadDelay          : 0,

        automatic             : false,
        automaticDelay        : 3000,
        automaticDirection    : 'next',
        automaticPauseOnHover : false,

        initiate   : function () {},
        complete   : function () {}
	};

	// =========================================================
	// Initialisation

	Carousel.prototype._init = function ()
	{  
        var self = this;

        this._setStartSlide();

        this.options.pagination && this._addPagination(); // Add pagination

        (this.options.animation === 'slide') ? this._setupSlide() : this._setupFade(); // Setup Carousel

        this.options.controls && this._addControls(); // Add Next/Prev Controls

        this.options.keyControls && this._addKeyControls(); // Add Keybord Controls

        (this.options.drag) && this._addDragControls();

        (this.options.automatic && this.options.automaticPauseOnHover) && this._pauseOnHover();

        this.options.automatic && this.start();

        if (this.options.responsive)
        {
            $(window).resize(function(){

                self._updateDimensions();
            });
        }              
	};

    // =========================================================
    // Preload Images

    Carousel.prototype._preLoad = function ()
    {   
        var self = this;

        if (this.options.preLoad)
        {   
            this.viewport.addClass('loading transition-active');

            this.slides.each(function ()
            {   
                self._preLoadSlide($(this));
            });
        }
        else
        {
            $(window).load(function ()
            {
                self._preLoadComplete();

                self.viewport.addClass('transition-active');
            });
        }
    };

    // =========================================================
    // Preload Individual Slide

    Carousel.prototype._preLoadSlide = function (slide, amount)
    {   
        var self       = this,
            noOfImages = slide.find('img').length,
            counter    = 0;

        slide.find('img').each(function ()
        {
            var image = new Image();

            image.onload = function ()
            {
                counter++;

                if (counter === noOfImages)
                {
                    self.preLoadCounter++;

                    (self.preLoadCounter === self.slides.length) && self._preLoadComplete();
                }
            }

            image.src = $(this).attr('src');
        });
    };

    // =========================================================
    // Preload Complete

    Carousel.prototype._preLoadComplete = function ()
    {   
        if (this.options.preLoadDelay !== 0)
        {
            setTimeout(function ()
            {
                this.wrap.height(this.slides.eq(this.activeSlide).outerHeight());
                this.viewport.css({'height' : (this.slides.eq(this.activeSlide).outerHeight())}).removeClass('loading');

            }.bind(this), this.options.preLoadDelay);            
        }
        else
        {
            this.wrap.height(this.slides.eq(this.activeSlide).outerHeight());
            this.viewport.css({'height' : (this.slides.eq(this.activeSlide).outerHeight())}).removeClass('loading');            
        }

    }

    // =========================================================
    // Set Starting Slide

    Carousel.prototype._setStartSlide = function ()
    {   
        var s = this.options.startSlide;

        if (this._isInfiniteSlider())
        {
             this.activeSlide = (!s || s < 0 || s > this.slides.length) ? 1 : s + 1; // If no start slide or slide is not within range
        }                                                                        // default to 1 to account for start clone
        else
        {
            this.activeSlide = (!s || s < 0 || s > this.slides.length) ? 0 : s; // If no start slide or slide is not within range
        }                                                                           // default to 0 else minus 1 to the start slide as is not infinite
    }

	// =========================================================
	// Setup Carousel - Slide Animation

	Carousel.prototype._setupSlide = function ()
	{  
        var self = this;

        this.wrap.addClass('slide transition-active').wrap('<div class="viewport"></div>');

        this.viewport = this.$el.find('div.viewport').css({'width' : this.width});

        this.options.infinite && this._setupInfiniteSlider();

        this.slides.css({'width' : this.width}).eq(this.activeSlide).addClass('active');

        this.wrap.css({'width': (this.slides.length * this.width), 'left': - (this.width * this.activeSlide) + 'px'});

        this._preLoad();
	};

    // =========================================================
    // Setup Carousel - Infinite 

    Carousel.prototype._setupInfiniteSlider = function ()
    {
        this.slides.eq(0).clone().attr('data-clone', 'last').appendTo(this.wrap); // add first slide to the end

        this.slides.eq(this.slides.length - 1).clone().attr('data-clone', 'first').prependTo(this.wrap); // add last slide to the beggining

        this.slides = this.wrap.find('> li'); // update slides object to account for clones
    }

    // ==================================================================================================================
    // Setup Fading Slideshow
    // ==================================================================================================================

    Carousel.prototype._setupFade = function() {

        var self = this;

        this.wrap.addClass('fade transition-active').wrap('<div class="viewport"></div>');

        this.viewport = this.$el.find('div.viewport');

        this.slides.css({'position':'absolute', 'width' : this.width});

        if (this.supportTransition && this.options.useCss)
        {
            this.slides.eq(this.activeSlide).addClass('no-transition');
            this.slides.eq(this.activeSlide).addClass('active');
            this.slides.eq(this.activeSlide).offsetHeight;
            this.slides.eq(this.activeSlide).removeClass('no-transition');
        }
        else
        {
            this.slides.hide().eq(this.activeSlide).show().addClass('active');  
        }

        this._preLoad();
    }

    // =========================================================
    // Insert Carousel Controls

    Carousel.prototype._addControls = function () 
    {
        var self     = this,
            next     = '<a class="direction-next" data-direction="forward"></a>',
            previous = '<a class="direction-previous" data-direction="previous"></a>';

        this.viewport.append(next).append(previous);

        this.$el.on('click', '[data-direction]', function(){

            (self.options.automatic && !self.options.automaticPauseOnHover) && self.start();

            ($(this).attr('data-direction') === 'forward') ? self.next(self.options.complete) : self.previous(self.options.complete);
        });
    };

    // =========================================================
    // Insert Carousel Drag Controls

    Carousel.prototype._addDragControls = function ()
    {   
        var self            = this,
            needsRestarting = false;

        this.wrap.on('mousedown.carousel', function (e)
        {    
            e.preventDefault();

            if (!self.inProgress)
            {   
                if (self.options.automatic)
                {
                    needsRestarting = true;
                    self.stop();
                }

                self.wrap.addClass('no-transition');

                var startPos = e.pageX,
                    currentLeft = parseInt(self.wrap.css('left'));

                self.wrap.off('mousemove.carousel').on('mousemove.carousel', function (moveEvt)
                {   
                    var mousePos = moveEvt.clientX,
                        move     = startPos - mousePos;

                    self.wrap.css('left', currentLeft - move);               
                });

                self.wrap.on('mouseup.carousel mouseleave.carousel', function (upEvt)
                {
                    var endPos   = upEvt.pageX,
                        callback = (needsRestarting) ? self.start : '';

                    self.wrap.off('mousemove.carousel mouseup.carousel mouseleave.carousel').removeClass('no-transition');

                    ((startPos - endPos) > 0) ? self.next(callback) : self.previous(callback);
                });
            }
        });
    };

    // =========================================================
    // Enables Pause On Hover Events

    Carousel.prototype._pauseOnHover = function ()
    {   
        var self = this;

        this.viewport.on('mouseenter', function ()
        {
            self.stop();

        }).on('mouseleave', function ()
        {
            self.start();
        });
    };

    // =========================================================
    // Insert Carousel Pagination

    Carousel.prototype._addPagination = function() {

        var self = this;

        this.pagination = $('<div class="slider-pagination"><ul></ul></div>');

        this.$el.append(this.pagination);

        this.slides.each(function (index, el)
        {
            self.pagination.children('ul').append('<li><a href="#" data-slide="' + index + '"></a></li>');
        });

        this.updatePagination();

        this.pagination.on('click', 'a', function (event)
        {
            event.preventDefault();

            (self.options.automatic && !self.options.automaticPauseOnHover) && self.start();

            self.to(parseInt($(this).attr('data-slide')), self.options.complete)
        });
    }

    // =========================================================
    // Update Carousel Pagination

    Carousel.prototype.updatePagination = function (index)
    {
        index = index || this.activeSlide;

        var toUpdate = (this._isInfiniteSlider()) ? index - 1 : index;

        this.pagination.find('a').removeClass('active').eq(toUpdate).addClass('active');
    };

    // =========================================================
    // Keyboard Events

    Carousel.prototype._addKeyControls = function ()
    {   
        var self = this;

        $(document).on('keydown', function (e)
        {
            var code = e.keyCode;

            switch(e.keyCode)
            {
            case 37:
                (self.options.automatic && !self.options.automaticPauseOnHover) && self.start();
                self.previous(self.options.complete);
                break;

            case 39:
                (self.options.automatic && !self.options.automaticPauseOnHover) && self.start();
                self.next(self.options.complete);
                break;

            default:
                break; 
            }
        });
    };

    // =========================================================
    // Find Next Slide

    Carousel.prototype.findNext = function (direction) {

        (direction === 'forward') ? this.activeSlide++ : this.activeSlide--;

        if (!this._isInfiniteSlider())
        {   
            if (direction === 'forward' && this.activeSlide === this.slides.length)
            {
                this.activeSlide = 0;
            }

            if (direction === 'previous' && this.activeSlide < 0)
            {
                this.activeSlide = this.slides.length - 1;
            }
        }
    };

    // =========================================================
    // Change Slide

    Carousel.prototype._change = function (direction, slide, callback) 
    {
        if (!this.inProgress) 
        {
            this.inProgress = true;

            if (slide !== null) 
            {   
                this.activeSlide = (this._isInfiniteSlider()) ? slide + 1 : slide;
            } 
            else 
            {
                this.findNext(direction);
            }

            (this.options.animation === 'slide') ? this._slide(callback) : this._fade(callback);
        }
    };

    // ==================================================================================================================
    // Slide New Position
    // ==================================================================================================================

    Carousel.prototype._slide = function (callback)
    {
        var self = this;

        if (this.supportTransition && this.options.useCss)
        {
            this.wrap.css('left', -(this.activeSlide * this.width) + 'px');

            this.wrap.one('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', function ()
            {
                self._slideComplete(callback);
            });
        }
        else
        {
            this.wrap.animate({'left': -(this.activeSlide * this.width) + 'px'}, function ()
            {
                self._slideComplete(callback);
            });
        }

        if (this.options.pagination && this.options.infinite && this.slides.eq(this.activeSlide).is('[data-clone]'))
        {
            var paginationToUpdate = (this.slides.eq(this.activeSlide).attr('data-clone') === 'last') ? 1 : this.slides.length - 2;            
        }

        this.options.pagination && this.updatePagination(paginationToUpdate);

        this.viewport.height(this.slides.eq(this.activeSlide).outerHeight());
    };

    // ==================================================================================================================
    // Slide Complete
    // ==================================================================================================================

    Carousel.prototype._slideComplete = function (callback)
    {   
        if (this.options.infinite && this.slides.eq(this.activeSlide).is('[data-clone]'))
        {
            this._infiniteReset();
        }

        this.slides.removeClass('active').eq(this.activeSlide).addClass('active');

        $.isFunction(callback) && callback.call(this);

        this.inProgress = false;           
    }

    // ==================================================================================================================
    // Slide Infinite Complete
    // ==================================================================================================================

    Carousel.prototype._infiniteReset = function ()
    {   
        this.activeSlide = (this.slides.eq(this.activeSlide).attr('data-clone') === 'last') ? 1 : this.slides.length - 2;

        if (this.supportTransition && this.options.useCss)
        {
            this.wrap.addClass('no-transition');
            this.wrap.css({'left': - (this.width * this.activeSlide) + 'px'});
            this.wrap[0].offsetHeight;
            this.wrap.removeClass('no-transition');
        }
        else
        {
            this.wrap.css({'left': - (this.width * this.activeSlide) + 'px'});   
        }     
    }

    // ==================================================================================================================
    // Fade New Position
    // ==================================================================================================================

    Carousel.prototype._fade = function (callback)
    {   
        var self = this;

        if (this.supportTransition && this.options.useCss)
        {
            this.slides.removeClass('active').eq(this.activeSlide).addClass('active');

            this.slides.eq(this.activeSlide).one('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', function ()
            {
                self._fadeComplete(callback);
            });            
        }
        else
        {
            this.slides.removeClass('active').fadeOut().eq(this.activeSlide).addClass('active').fadeIn(function ()
            {
                self._fadeComplete(callback);   
            });
        }

        this.options.pagination && this.updatePagination();
    };

    // ==================================================================================================================
    // Fade Complete
    // ==================================================================================================================

    Carousel.prototype._fadeComplete = function (callback)
    {
        $.isFunction(callback) && callback.call(this);

        this.inProgress = false;
    }

    // ==================================================================================================================
    // Window Resize Event
    // ==================================================================================================================

    Carousel.prototype._updateDimensions = function ()
    {
        this.width = this.$el.outerWidth();

        this.slides.css({'width' : this.width});

        this.viewport.css({'width' : this.width}).height(this.slides.eq(this.activeSlide).outerHeight());

        if (this.options.animation === 'slide') 
        {   
            this.wrap.addClass('no-transition');
            this.wrap.css({'width': (this.slides.length * this.width), 'left': - (this.width * this.activeSlide) + 'px'});
            this.wrap[0].offsetHeight;
            this.wrap.removeClass('no-transition');            
        }
        else 
        {
            this.wrap.width(this.width).height(this.slides.eq(this.activeSlide).outerHeight());
        }
    };

    // ==================================================================================================================
    // Returns If Is An Infinite Slider
    // ==================================================================================================================

    Carousel.prototype._isInfiniteSlider = function ()
    {
        return ((this.options.animation === 'slide') && (this.options.infinite));
    }

    // ==================================================================================================================
    // Public Methods
    // ==================================================================================================================

    // =========================================================
    // Next Slide

    Carousel.prototype.next = function (callback)
    {
        this._change('forward', null, callback);
    };

    // =========================================================
    // Previous Slide

    Carousel.prototype.previous = function (callback)
    {
        this._change('previous', null, callback);
    };

    // =========================================================
    // To Slide

    Carousel.prototype.to = function (slide, callback)
    {   
        var max          = (this._isInfiniteSlider()) ? (this.slides.length - 2) : this.slides.length, // Find the max slide
            currentSlide = (this._isInfiniteSlider()) ? this.activeSlide - 1 : this.activeSlide; // Find the current slide taking into account 0 based for non infinite slider

        if ((slide >= 0) && (slide < max) && (currentSlide !== parseInt(slide))) // If slide is in allowed range & not the current slide
        {
            this._change(null, slide, callback);
        }
    };

    // =========================================================
    // Start Automatic Carousel

    Carousel.prototype.start = function ()
    {
        var self = this;

        this.options.automatic = true; // Set automatic options to true

        this.interval !== null && clearInterval(this.interval); // If interval is currently running clear it, gets called after each complete slide

        this.interval = setInterval(function () // Restart the interval
        {
            self[self.options.automaticDirection]();

        }, this.options.automaticDelay);
    };

    // =========================================================
    // Start Automatic Carousel

    Carousel.prototype.stop = function ()
    {   
        this.options.automatic = false;

        this.interval !== null && clearInterval(this.interval);
    };

	// ==================================================================================================================
    // Carousel Plugin Function
    // ==================================================================================================================

	function Plugin (options)
	{
        var args = Array.prototype.slice.call(arguments, 1);

        return this.each(function ()
        {   
            var el   = $(this), 
                data = el.data('carousel');

            if (!data)
            {
                 el.data('carousel', (data = new Carousel(this, options)));
            }

            if (typeof options === "string")
            {
                if (data[options] && options[0] !== '_')
                {
                    data[options].apply(data, args);
                }
            }       
        });
	}

    $.fn.carousel = Plugin;    

}(window, document, jQuery));