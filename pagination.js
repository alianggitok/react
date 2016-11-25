/**
 * @module
 * @author Warren
 */
'use strict';

var block=React.createClass({
	getDefaultProps:function(){
		return{
			totalCount:0,//数据总量
			currentPage:1,//当前页码
			perPageSize:10,//每页显示数量
			pagePaddingLength:3,//当前页的左右显示填补量
			i18n:{//国际化
				PREVIOUS:'Previous',
				NEXT:'Next',
				TOTAL_UNIT:'items'
			},
			turnToPage:function(){//翻页处理函数
				console.log('No turnToPage function!');
			}
		}
	},
	getInitialState:function(){
		return{
			
		};
	},
	turnToPage:function(event,i){
		// console.log(event,i)
		this.props.turnToPage(event,i);
	},
	render:function(){
		var _class=this,
			i18n=_class.props.i18n,
			totalCount=this.props.totalCount,
			currentPage=this.props.currentPage,
			perPageSize=this.props.perPageSize,
			pageCount=Math.ceil(totalCount / perPageSize),//向上取整
			pagePaddingLength=this.props.pagePaddingLength;

		var pagination = (function(){
			// console.log('pagination render: \ncurrent:',currentPage,'\nCount:',pageCount,'\nresult total:',totalCount)
			var pages=[],
				maxDisplaySize=pagePaddingLength*2+1,//除首页、尾页外的页码总数
				pageStart=1,
				pageEnd=pageCount;

			pageStart=currentPage-pagePaddingLength;
			pageEnd=currentPage+pagePaddingLength;

			if(pageStart<1){//当前页小于最小填补量时
				pageStart=1;
				pageEnd=maxDisplaySize;
			}
			if(pageEnd>pageCount){//当前页大于最大填补量时
				pageStart=pageCount-maxDisplaySize+1;//需要分页是从非0开始的所以要+1
				pageEnd=pageCount;
			}
			if(pageCount<maxDisplaySize){//当总页数小于最大显示页数时
				pageStart=1;
				pageEnd=pageCount;
			}

			// console.warn('page:\ncurrent:',currentPage,'\npageStart:',pageStart,'\npageEnd:',pageEnd,'\nCount:',pageCount,'\nmaxDisplaySize:',maxDisplaySize,'\nresult total:',totalCount);
			
			if(pageCount>1){//分页数大于1才显示分页
				if(currentPage>1){//上一页
					pages.push(<li key={'previous'} className="pagination-previous"><a onClick={(event)=>_class.turnToPage(event,currentPage-1)}>{i18n.PREVIOUS}</a></li>);
				}

				if(pageStart>1){//第一页
					pages.push(<li key={'first'} className="pagination-first"><a onClick={(event)=>_class.turnToPage(event,1)}>1</a></li>);
				}
				if(pageStart>2){//省略号
					pages.push(<li key={'pre-elliptic'} className="pagination-pre-elliptic">...</li>);
				}

				for(let i = pageStart; i <= pageEnd; i++) {//页码
					pages.push(<li key={i} className={i === currentPage ? 'active' : ''}><a onClick={(event)=>_class.turnToPage(event,i)}>{i}</a></li>);
				}

				if(pageEnd<pageCount-1){//省略号
					pages.push(<li key={'next-elliptic'} className="pagination-next-elliptic">...</li>);
				}
				if(pageEnd<pageCount){//最末页
					pages.push(<li key={'last'} className="pagination-last"><a onClick={(event)=>_class.turnToPage(event,pageCount)}>{pageCount}</a></li>);
				}

				if(currentPage<pageCount){//下一页
					pages.push(<li key={'next'} className="pagination-next"><a onClick={(event)=>_class.turnToPage(event,currentPage+1)}>{i18n.NEXT}</a></li>);
				}

			}

			pages.push(<li key={'info'} className="pagination-info floatright">{totalCount+' '+i18n.TOTAL_UNIT} </li>);

			return pages;
		}());
		

		if(totalCount){//有数据才显示
			return(
				<div className="pagination col-xs-12">
					<ul>
						{pagination}
					</ul>
				</div>
			)
		}else{
			return null;
		}

	 }
 });

 module.exports=block;