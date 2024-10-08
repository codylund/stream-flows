import { AddSite, DeleteSite, GetSites, UpdateSite } from '../services/SitesService'
import React, { type FC } from 'react'
import { AddSiteButton } from './AddSiteButton'
import Box from '@mui/material/Box'
import { Card } from '@mui/material'
import { Filters } from '../../../filters/models/Filters'
import { FiltersContext } from '../../../filters/context/FiltersContext'
import { FlowAppBar } from '../../../navigation/components/FlowAppBar'
import { FlowChart } from '../../../usgs/components/FlowChart'
import { type FlowSeries } from '../../../usgs/models/FlowSeries'
import Grid from '@mui/material/Grid'
import { LoadFlows } from '../../../usgs/services/USGSService'
import { LoadingBackdrop } from '../../../common/components/LoadingBackdrop'
import { type Site } from '../models/Site'
import { TagsContext } from '../../../filters/context/TagsContext'
import { isMobile } from 'react-device-detect'
import { useNavigate } from 'react-router-dom'

export const SitesGrid: FC = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = React.useState(true)
  const [sites, setSites] = React.useState([] as Site[])
  const [flows, setFlows] = React.useState([] as FlowSeries[])
  const [lookback, setLookback] = React.useState(7)
  const [filters, setFilters] = React.useState([] as Filters[])
  const [selectedTags, setSelectedTags] = React.useState([] as string[])

  // Load sites from the DB.
  React.useEffect(() => {
    GetSites()
      .then(sites => {
        setSites(sites)
      })
      .catch(e => {
        navigate('/signin')
      })
  }, [])

  React.useEffect(() => {
    if (sites.length <= 0) {
      setFlows([])
      setLoading(false)
      return
    }
    console.log('Loading flows for sites:')
    console.log(sites)
    LoadFlows(lookback, sites)
      .then(flows => {
        setFlows(flows)
      })
      .catch(e => {
        console.error('Flow lookup failed.', e.stack)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [lookback, sites])

  const resetFilters = (): void => {
    setFilters([])
    setSelectedTags([])
  }

  const onSiteAdded = (siteId: string): void => {
    setLoading(true)
    // Push site to the DB.
    AddSite(siteId, false)
      .then(site => {
        console.log('Successfully added site: ' + siteId)
        // Update local cache of sites.
        setSites(sites.concat([site]))
        resetFilters()
      })
      .catch(e => {
        console.error('Failed to add site.', e.stack)
      })
  }

  const onDeleteSite = (siteId: string): void => {
    setLoading(true)
    DeleteSite(siteId)
      .then(_ => {
        console.log(`Successfully deleted site ${siteId}`)
        setSites(sites.filter(site => site._id !== siteId))
        resetFilters()
      })
      .catch(err => {
        console.log('Failed to delete site: ', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const onSetFavorite = (siteId: string, isFavorite: boolean): void => {
    console.log(`updating site ${siteId} to favorite`)
    UpdateSite(siteId, { is_favorite: isFavorite })
      .then(_ => {
        console.log(`Successfully set site ${siteId} as favorite.`)
        setSites(sites.map(site => {
          if (site._id === siteId) {
            site.is_favorite = isFavorite
          }
          return site
        }))
      })
      .catch(err => {
        console.log('Failed to update site: ', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const onTagsUpdated = (siteId: string, tags: string[]): void => {
    console.log(`updating site ${siteId} with tags ${tags.toString()}`)
    UpdateSite(siteId, { tags })
      .then(_ => {
        console.log(`Successfully set site ${siteId} as favorite.`)
        setSites(sites.map(site => {
          if (site._id === siteId) {
            site.tags = tags
          }
          return site
        }))
        resetFilters()
      })
      .catch(err => {
        console.log('Failed to udpate site: ', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const filterSite = (site: Site): boolean => {
    const flow = flows.find(flow => flow.siteId === site.site_id)
    if (flow === undefined) {
      return false
    }

    if (filters.length <= 0 && selectedTags.length <= 0) {
      console.log('No filters to apply.')
      return true
    }

    // Apply site filters
    let show = false
    filters.forEach(filter => {
      if (filter === Filters.FAVORITES && site.is_favorite) {
        console.log('Including favorite')
        show = true
      }
    })

    // Filter tags.
    selectedTags.forEach(tag => {
      if (site.tags?.includes(tag)) {
        console.log(`Including site with tag ${tag}`)
        show = true
      }
    })

    return show
  }

  let columns = 12
  if (isMobile) { columns = 1 }

  const rawTags: string[] = sites
    .map(site => site.tags)
    .flat()
  const tags: string[] = rawTags
    // Remove duplicates.
    .filter((tag, idx) => rawTags.indexOf(tag) === idx)
    // Remove null/empty tags.
    .filter((tag) => tag != null && tag.length > 0)
    // Sort alphabetically
    .sort((tagA, tagB) => tagA.localeCompare(tagB))

  return (
    <FiltersContext.Provider value={{ filters, setFilters }}>
      <TagsContext.Provider value={{ tags, selectedTags, setSelectedTags }}>
        <Box sx={{ width: '100%' }}>
          <LoadingBackdrop open={loading} />
          <FlowAppBar
            lookback={lookback}
            onLookbackUpdated={setLookback} />
          <Grid container columns={columns} sx={{ flexGrow: 1 }} spacing={2} style={{ padding: '16px' }}>
            {sites.filter(filterSite).map((site) => {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const flow = flows.find(flow => flow.siteId === site.site_id)!
              console.log('showing site')
              return (
                <Grid key={flow.location} item xs={6}>
                  <Card variant="outlined">
                    <FlowChart
                      flow={flow}
                      site={site}
                      onDeleteSite={onDeleteSite}
                      onSetFavorite={onSetFavorite}
                      onTagsUpdated={onTagsUpdated}
                    />
                  </Card>
                </Grid>
              )
            })}
          </Grid>
          <AddSiteButton onSiteAdded={onSiteAdded} />
        </Box>
      </TagsContext.Provider>
    </FiltersContext.Provider>
  )
}
