(function (window, document, $)
{	
    function supportTransitions()
    {
        var b = document.body || document.documentElement,
            s = b.style,
            p = 'transition';

        if (typeof s[p] == 'string') { return true; }

        var v = ['Moz', 'webkit', 'Webkit', 'Khtml', 'O', 'ms'];
        p = p.charAt(0).toUpperCase() + p.substr(1);

        for (var i = 0; i < v.length; i++) 
        {
            if (typeof s[v[i] + p] == 'string') { return true; }
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

		this.wrap        = this.$el.find('> ul');
		this.slides      = this.wrap.find('> li');
		this.width       = this.$el.width();
		this.activeSlide = 0;
		this.inProgress  = false;
        this.supportTransition = supportTransitions();

		this.options = $.extend({}, this.defaultOptions, options, this.$el.data());

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
        animation   : 'slide',
        controls    : true,
        pagination  : true,
        keyControls : true,
        captions    : false,
        responsive  : true,
        infinite    : true,

        initiate   : function () {},
        complete   : function () {}
	};

	// =========================================================
	// Initialisation

	Carousel.prototype._init = function ()
	{  
        var self = this;

        this.options.pagination && this._addPagination(); // Add pagination

        (this.options.animation === 'slide') ? this._setupSlide() : this_setupFade(); // Setup Carousel

        this.options.controls && this._addControls(); // Add Next/Prev Controls

        this.options.keyControls && this._addKeyControls(); // Add Keybord Controls

        if (this.options.responsive)
        {
            $(window).resize(function(){

                self._updateDimensions();
            });
        }
	};

	// =========================================================
	// Setup Carousel - Slide Animation

	Carousel.prototype._setupSlide = function ()
	{  
        var self = this;

        this.wrap.wrap('<div class="viewport"></div>');

        this.viewport = this.$el.find('div.viewport').css({'width' : this.width});

        this.options.infinite && this._setupInfiniteSlider();

        this.wrap.css({'width': (this.slides.length * this.width), 'left': - (this.width * this.activeSlide) + 'px'});

        this.slides.css({'width' : this.width});
        
        $(window).load(function(){ 

            self.viewport.css({'height' : (self.slides.eq(self.activeSlide).outerHeight())});
        });
	};

    // =========================================================
    // Setup Carousel - Infinite 

    Carousel.prototype._setupInfiniteSlider = function ()
    {
        this.slides.eq(0).clone().attr('data-clone', 'last').appendTo(this.wrap); // add first slide to the end

        this.slides.eq(this.slides.length - 1).clone().attr('data-clone', 'first').prependTo(this.wrap); // add last slide to the beggining

        this.slides = this.wrap.find('> li'); // update slides object to account for clones

        this.activeSlide = 1;
    }

    // =========================================================
    // Insert Carousel Controls

    Carousel.prototype._addControls = function() {

        var self     = this;
            next     = '<a class="direction-next" data-direction="forward"></a>',
            previous = '<a class="direction-previous" data-direction="previous"></a>';

        this.viewport.append(next).append(previous);

        this.$el.on('click', '[data-direction]', function(){

            ($(this).attr('data-direction') === 'forward') ? self.next(self.options.complete) : self.previous(self.options.complete);
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
            self.pagination.children('ul').append('<li><a href="#" data-slide="' + (index + 1) + '"></a></li>');
        });

        this.pagination.find('a').eq(0).addClass('active');

        this.pagination.on('click', 'a', function (event)
        {
            event.preventDefault();

            self.to($(this).attr('data-slide'), self.options.complete)
        });
    }

    // =========================================================
    // Update Carousel Pagination

    Carousel.prototype.updatePagination = function (number) {

        this.pagination.find('a').removeClass('active').eq(number).addClass('active');
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
                self.previous(self.options.complete);
                break;

            case 39:
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

        if ((this.options.animation === 'fade') || (this.options.animation === 'slide' && !this.options.infinite))
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

            if (slide) 
            {   
                this.activeSlide = (this.options.animation === 'slide' && this.options.infinite) ? slide : slide - 1;
            } 
            else 
            {
                this.findNext(direction);
            }

            (this.options.animation === 'slide') ? this.slide(callback) : this.fade(callback);
        }
    };

    // ==================================================================================================================
    // Slide New Position
    // ==================================================================================================================

    Carousel.prototype.slide = function (callback)
    {
        var self = this;

        if (this.supportTransition)
        {
            this.wrap.css('left', -(this.activeSlide * this.width) + 'px');

            this.wrap.one('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', function ()
            {
                self._slideComplete(callback);
            });     
        }
        else
        {
            this.wrap.animate({'left': - (this.activeSlide * this.width) + 'px'}, function ()
            {
                self._slideComplete(callback);
            });
        }

        this.viewport.height(this.slides.eq(this.activeSlide).outerHeight());
    };

    // ==================================================================================================================
    // Slide Complete
    // ==================================================================================================================

    Carousel.prototype._slideComplete = function (callback)
    {   
        if (this.options.infinite && this.slides.eq(this.activeSlide).is('[data-clone]'))
        {
            this.activeSlide = (this.slides.eq(this.activeSlide).attr('data-clone') === 'last') ? 1 : this.slides.length - 2;

            this._infiniteSlideComplete();
        }

        if (this.options.pagination)
        {   
            var paginateToUpdate = (this.options.infinite) ? this.activeSlide - 1 : this.activeSlide;

            this.updatePagination(paginateToUpdate);  
        }

        if ($.isFunction(callback))
        {
            callback.call(this);
        };

        this.inProgress = false;           
    }

    // ==================================================================================================================
    // Slide Infinite Complete
    // ==================================================================================================================

    Carousel.prototype._infiniteSlideComplete = function ()
    {
        if (this.supportTransition)
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
    // Window Resize Event
    // ==================================================================================================================

    Carousel.prototype._updateDimensions = function(){

        this.width = this.$el.outerWidth();

        this.slides.css({'width' : this.width});

        this.viewport.css({'width' : this.width}).height(this.slides.eq(this.activeSlide).outerHeight());

        if (this.options.animation === 'slide') 
        {
            this.wrap.css({'width': (this.slides.length * this.width), 'left': - (this.width * this.activeSlide) + 'px'});
        }
        else 
        {
            this.wrap.width(this.width).height(this.slides.eq(this.activeSlide).outerHeight());
        }
    };

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
        if ((slide > 0) && (slide < this.slides.length - 1))
        {
            this._change(null, slide, callback);   
        }
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

	// ==================================================================================================================
    // Carousel API Events
    // ==================================================================================================================    

}(window, document, jQuery));